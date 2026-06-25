import freighter from '@stellar/freighter-api';
import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  BASE_FEE,
  Memo,
  StrKey,
} from '@stellar/stellar-sdk';
import type { TransactionRecord, AssetBalance } from '@/types';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    await freighter.isConnected();
    return true;
  } catch {
    return false;
  }
}

export async function isFreighterConnected(): Promise<boolean> {
  try {
    const result = await freighter.isConnected();
    return result?.isConnected ?? false;
  } catch {
    return false;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

export async function connectWallet(): Promise<string> {
  const result = await withTimeout(
    freighter.requestAccess(),
    30000,
    'Connection timed out — please approve the request in the Freighter popup, or refresh and try again.',
  );
  if (result.error) {
    throw new Error(result.error.message || 'Failed to connect');
  }
  if (!result.address) {
    throw new Error('No address returned from Freighter. Make sure your wallet is unlocked and set to Testnet.');
  }
  return result.address;
}

export async function getAllBalances(publicKey: string): Promise<AssetBalance[]> {
  const account = await server.loadAccount(publicKey);
  return account.balances as AssetBalance[];
}

export async function getRecentTransactions(publicKey: string): Promise<TransactionRecord[]> {
  const response = await server
    .transactions()
    .forAccount(publicKey)
    .order('desc')
    .limit(12)
    .call();

  return response.records.map((record) => ({
    id: record.id,
    hash: record.hash,
    created_at: record.created_at,
    memo: typeof record.memo === 'string' ? record.memo : undefined,
    successful: record.successful,
    ledger: record.ledger_attr,
  }));
}

export async function getXlmBalance(publicKey: string): Promise<string> {
  const balances = await getAllBalances(publicKey);
  const balance = balances.find((b) => b.asset_type === 'native');
  return balance?.balance ?? '0';
}

export async function fundWithFriendbot(publicKey: string): Promise<string> {
  const response = await fetch(
    `https://friendbot.stellar.org?addr=${publicKey}`
  );
  const data = await response.json();
  if (data.hash) {
    return data.hash;
  }
  const detail = data.detail || data.title || 'Funding failed';
  throw new Error(detail);
}

export function assertValidPublicKey(value: string, label = 'Stellar address'): void {
  if (!StrKey.isValidEd25519PublicKey(value)) {
    throw new Error(`${label} must be a valid Stellar public key`);
  }
}

export function normalizeAssetLabel(assetCode?: string): string {
  return assetCode && assetCode.trim().length > 0 ? assetCode.trim().toUpperCase() : 'XLM';
}

function formatSubmitError(error: unknown): string {
  if (error instanceof Error) return error.message;

  const maybeError = error as {
    response?: { data?: { extras?: { result_codes?: Record<string, string> }; title?: string } };
    message?: string;
  };
  const resultCodes = maybeError.response?.data?.extras?.result_codes;
  if (resultCodes) {
    return Object.entries(resultCodes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
  return maybeError.response?.data?.title || maybeError.message || 'Transaction failed';
}

export async function sendAssetPayment(
  senderPublicKey: string,
  destination: string,
  amount: string,
  message?: string,
  assetCode?: string,
  assetIssuer?: string
): Promise<{ hash: string; success: boolean }> {
  assertValidPublicKey(senderPublicKey, 'Sender');
  assertValidPublicKey(destination, 'Recipient');
  if (assetCode && assetCode !== 'XLM') {
    if (!assetIssuer) throw new Error('Custom assets require an issuer public key');
    assertValidPublicKey(assetIssuer, 'Asset issuer');
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  const senderAccount = await server.loadAccount(senderPublicKey);

  const asset = assetCode && assetIssuer && assetCode !== 'XLM'
    ? new Asset(assetCode, assetIssuer)
    : Asset.native();

  const txBuilder = new TransactionBuilder(senderAccount, {
    fee: BASE_FEE.toString(),
    networkPassphrase,
  }).addOperation(
    Operation.payment({
      destination,
      asset,
      amount,
    })
  );

  if (message) {
    txBuilder.addMemo(Memo.text(message));
  }

  const transaction = txBuilder.setTimeout(30).build();
  const xdr = transaction.toXDR();

  const signedResult = await freighter.signTransaction(xdr, {
    networkPassphrase,
  });

  if (signedResult.error) {
    throw new Error(signedResult.error.message || 'Failed to sign transaction');
  }

  const signedTx = TransactionBuilder.fromXDR(
    signedResult.signedTxXdr,
    networkPassphrase
  );

  try {
    const result = await server.submitTransaction(signedTx);
    return { hash: result.hash, success: result.successful };
  } catch (err) {
    throw new Error(formatSubmitError(err), { cause: err });
  }
}

export const sendXlm = sendAssetPayment;
