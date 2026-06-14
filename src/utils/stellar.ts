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

export async function checkFreighter(): Promise<boolean> {
  try {
    await freighter.isConnected();
    return true;
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

export async function getXlmBalance(publicKey: string): Promise<string> {
  const account = await server.loadAccount(publicKey);
  const balance = account.balances.find((b: any) => b.asset_type === 'native');
  if (!balance) return '0';
  return balance.balance;
}

export async function sendXlm(
  senderPublicKey: string,
  destination: string,
  amount: string,
  message?: string
): Promise<{ hash: string; success: boolean }> {
  const senderAccount = await server.loadAccount(senderPublicKey);

  const txBuilder = new TransactionBuilder(senderAccount, {
    fee: BASE_FEE.toString(),
    networkPassphrase,
  }).addOperation(
    Operation.payment({
      destination,
      asset: Asset.native(),
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
