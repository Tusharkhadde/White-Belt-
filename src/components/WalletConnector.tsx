import { useState, useEffect, useRef, useCallback } from 'react';
import { checkFreighter, connectWallet } from '../utils/stellar';

interface Props {
  onConnect: (publicKey: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  publicKey: string | null;
}

export default function WalletConnector({ onConnect, onDisconnect, isConnected, publicKey }: Props) {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<number | null>(null);

  const detect = useCallback(async () => {
    const found = await checkFreighter();
    if (found) {
      setInstalled(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const found = await detect();
      if (cancelled) return;
      if (!found) {
        pollRef.current = window.setTimeout(poll, 1000);
      }
    }

    detect().then((found) => {
      if (cancelled) return;
      if (!found) {
        pollRef.current = window.setTimeout(poll, 1000);
      }
    });

    return () => {
      cancelled = true;
      if (pollRef.current !== null) {
        clearTimeout(pollRef.current);
      }
    };
  }, [detect]);

  const handleRetry = async () => {
    setError('');
    const found = await detect();
    if (!found) {
      setError('Freighter not detected. Make sure the extension is installed and refreshed.');
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const pk = await connectWallet();
      onConnect(pk);
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
  };

  const shortKey = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : '';

  if (installed === null) {
    return (
      <div className="card">
        <p className="status">Checking for Freighter...</p>
        <button className="btn btn-secondary btn-small" style={{ marginTop: 8 }} onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (!installed) {
    return (
      <div className="card">
        <p className="status error">Freighter wallet not detected.</p>
        <ol style={{ fontSize: '0.85rem', color: '#555', paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
          <li>Install <a href="https://freighter.app" target="_blank" rel="noopener noreferrer">Freighter</a> if you haven't</li>
          <li>Refresh this page (<strong>F5</strong>)</li>
          <li>Check your browser's extension list to confirm Freighter is enabled</li>
          <li>Open console (<strong>F12</strong>) and type: <code>window.freighterApi</code> — if it's <code>undefined</code>, the extension isn't injecting</li>
        </ol>
        <button className="btn btn-secondary btn-small" onClick={handleRetry}>
          Check Again
        </button>
      </div>
    );
  }

  return (
    <div className="card wallet-card">
      {isConnected ? (
        <>
          <div className="wallet-info">
            <span className="badge connected">Connected</span>
            <code className="address">{shortKey}</code>
          </div>
          <button className="btn btn-secondary" onClick={handleDisconnect}>
            Disconnect
          </button>
        </>
      ) : (
        <button className="btn btn-primary" onClick={handleConnect} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect Freighter Wallet'}
        </button>
      )}
      {error && <p className="status error">{error}</p>}
    </div>
  );
}
