import freighter from '@stellar/freighter-api';
import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  BASE_FEE,
} from '@stellar/stellar-sdk';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = Networks.TESTNET;

export async function checkFreighter(): Promise<boolean> {
  try {
    const result = await freighter.isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

export async function connectWallet(): Promise<string> {
  try {
    const result = await freighter.requestAccess();
    if (result.error) {
      throw new Error(result.error.message || 'Failed to connect');
    }
    return result.address;
  } catch (err: any) {
    if (err.message?.includes('Freighter') || err.message?.includes('User declined')) {
      throw err;
    }
    throw new Error('Connection cancelled or Freighter is locked.');
  }
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
  amount: string
): Promise<{ hash: string }> {
  const senderAccount = await server.loadAccount(senderPublicKey);

  const transaction = new TransactionBuilder(senderAccount, {
    fee: BASE_FEE.toString(),
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(30)
    .build();

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
  return { hash: result.hash };
}
