import { useState, useEffect, useCallback, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { checkFreighter, connectWallet } from '@/utils/stellar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

gsap.registerPlugin(useGSAP);

interface Props {
  onConnect: (publicKey: string) => void;
  onDisconnect: () => void;
  publicKey: string | null;
}

export default function WalletConnector({ onConnect, onDisconnect, publicKey }: Props) {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const detect = useCallback(async () => {
    const found = await checkFreighter();
    if (found) setInstalled(true);
    return found;
  }, []);

  useEffect(() => { detect(); }, [detect]);

  useGSAP(() => {
    if (installed === null) return;
    gsap.from(containerRef.current, {
      y: -10,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    });
  }, { dependencies: [installed], scope: containerRef });

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const pk = await connectWallet();
      onConnect(pk);
      gsap.from(containerRef.current, {
        scale: 1.05,
        duration: 0.3,
        ease: 'back.out(2)',
      });
      toast.success('Wallet connected', {
        description: `${pk.slice(0, 4)}...${pk.slice(-4)}`,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      toast.error('Connection failed', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (installed === null) {
    return (
      <div ref={containerRef} className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Initializing Freighter...
      </div>
    );
  }

  if (!installed) {
    return (
      <div ref={containerRef} className="text-center space-y-4 py-4">
        <div className="text-4xl opacity-30">🦊</div>
        <p className="text-destructive text-sm font-medium">Freighter not detected</p>
        <p className="text-muted-foreground text-xs max-w-sm mx-auto">
          Install the{' '}
          <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            Freighter browser extension
          </a>
          , set it to <span className="text-primary font-mono text-[11px]">Testnet</span>, and refresh.
        </p>
        <Button variant="outline" size="sm" onClick={detect}>
          <svg className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </Button>
      </div>
    );
  }

  if (publicKey) {
    return (
      <div ref={containerRef} className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="gap-2 px-3 py-1.5 text-sm">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
          {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
        </Badge>
<button
  onClick={handleCopy}
  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
  aria-label={copied ? 'Copied' : 'Copy address'}
>
          {copied ? (
            <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </button>
<a
  href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs text-muted-foreground hover:text-primary transition-colors"
  aria-label="View on StellarExpert"
>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <Button variant="ghost" size="sm" onClick={onDisconnect} className="text-xs">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-3">
      <Button onClick={handleConnect} disabled={loading} size="lg" className="gap-2 w-full sm:w-auto">
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
