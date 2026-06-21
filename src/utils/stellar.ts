import freighter from '@stellar/freighter-api';
import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  BASE_FEE,
  Memo,
} from '@stellar/stellar-sdk';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;

export interface AssetBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

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

export async function connectWallet(): Promise<string> {
  const result = await freighter.requestAccess();
  if (result.error) {
    throw new Error(result.error.message || 'Failed to connect');
  }
  return result.address;
}

export async function getAllBalances(publicKey: string): Promise<AssetBalance[]> {
  const account = await server.loadAccount(publicKey);
  return account.balances as AssetBalance[];
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

export async function sendXlm(
  senderPublicKey: string,
  destination: string,
  amount: string,
  message?: string,
  assetCode?: string,
  assetIssuer?: string
): Promise<{ hash: string; success: boolean }> {
  const senderAccount = await server.loadAccount(senderPublicKey);

  const asset = assetCode && assetIssuer
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

  const result = await server.submitTransaction(signedTx);
  return { hash: result.hash, success: result.successful };
}
