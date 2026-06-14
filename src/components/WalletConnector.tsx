import { useState, useEffect, useCallback } from 'react';
import { checkFreighter, connectWallet } from '@/utils/stellar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Props {
  onConnect: (publicKey: string) => void;
  onDisconnect: () => void;
  publicKey: string | null;
}

export default function WalletConnector({ onConnect, onDisconnect, publicKey }: Props) {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const detect = useCallback(async () => {
    const found = await checkFreighter();
    if (found) setInstalled(true);
    return found;
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

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

  if (installed === null) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Checking for Freighter...
      </div>
    );
  }

  if (!installed) {
    return (
      <div className="text-center space-y-3">
        <p className="text-destructive text-sm">Freighter not detected.</p>
        <p className="text-muted-foreground text-xs">
          <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-primary underline">Install Freighter</a>
          {' '}extension, then refresh the page.
        </p>
        <Button variant="outline" size="sm" onClick={detect}>Try Again</Button>
      </div>
    );
  }

  if (publicKey) {
    return (
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="gap-2 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
        </Badge>
        <Button variant="ghost" size="sm" onClick={onDisconnect}>Disconnect</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={handleConnect} disabled={loading} size="lg" className="gap-2">
        {loading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Connecting...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect Freighter Wallet
          </>
        )}
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
