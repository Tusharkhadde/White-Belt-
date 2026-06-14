import { useState } from 'react';
import { sendXlm } from '../utils/stellar';

interface Props {
  publicKey: string | null;
}

interface TxResult {
  hash: string;
  success: boolean;
}

export default function SendPayment({ publicKey }: Props) {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { hash } = await sendXlm(publicKey, destination, amount);
      setResult({ hash, success: true });
      setDestination('');
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setResult({ hash: '', success: false });
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) return null;

  return (
    <div className="card payment-card">
      <h2>Send XLM</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="dest">Destination Address</label>
          <input
            id="dest"
            type="text"
            placeholder="G..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="amount">Amount (XLM)</label>
          <input
            id="amount"
            type="number"
            step="0.0000001"
            min="0.0000001"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send XLM'}
        </button>
      </form>

      {error && <p className="status error">{error}</p>}

      {result && result.success && (
        <div className="tx-success">
          <p className="status success">Transaction successful!</p>
          <p className="tx-hash">
            Hash: <code>{result.hash}</code>
          </p>
        </div>
      )}

      {result && !result.success && !error && (
        <p className="status error">Transaction failed.</p>
      )}
    </div>
  );
}
