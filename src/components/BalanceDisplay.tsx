import { useState, useEffect, useCallback } from 'react';
import { getXlmBalance } from '../utils/stellar';

interface Props {
  publicKey: string | null;
}

export default function BalanceDisplay({ publicKey }: Props) {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError('');
    try {
      const bal = await getXlmBalance(publicKey);
      setBalance(bal);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (!publicKey) return null;

  return (
    <div className="card balance-card">
      <h2>XLM Balance</h2>
      {loading && <p className="status">Loading...</p>}
      {error && <p className="status error">{error}</p>}
      {balance !== null && !loading && (
        <p className="balance-amount">{parseFloat(balance).toFixed(7)} XLM</p>
      )}
      <button className="btn btn-secondary btn-small" onClick={fetchBalance} disabled={loading}>
        Refresh
      </button>
    </div>
  );
}
