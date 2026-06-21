import { useState, useEffect, useCallback, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Wallet, CopySimple, Check, ArrowClockwise, Plugs, Eye } from '@phosphor-icons/react';
import { isFreighterInstalled, isFreighterConnected, connectWallet } from '@/utils/stellar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

gsap.registerPlugin(useGSAP);

interface Props {
  onConnect: (publicKey: string) => void;
  onDisconnect: () => void;
  publicKey: string | null;
}

type ConnectState = 'loading' | 'installing' | 'disconnected' | 'connected';

export default function WalletConnector({ onConnect, onDisconnect, publicKey }: Props) {
  const [state, setState] = useState<ConnectState>('loading');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const detect = useCallback(async () => {
    setState('loading');
    const installed = await isFreighterInstalled();
    if (!installed) {
      setState('installing');
      return;
    }
    const connected = await isFreighterConnected();
    setState(connected ? 'connected' : 'disconnected');
  }, []);

  useEffect(() => { detect(); }, [detect]);

  useEffect(() => {
    if (publicKey) setState('connected');
  }, [publicKey]);

  useGSAP(() => {
    if (state === 'loading') return;
    gsap.from(containerRef.current, {
      y: -8,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    });
  }, { dependencies: [state], scope: containerRef });

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      const pk = await connectWallet();
      onConnect(pk);
      setState('connected');
      toast.success('Wallet connected', {
        description: `${pk.slice(0, 4)}...${pk.slice(-4)}`,
      });
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('reject') || msg.includes('deny') || msg.includes('cancel')) {
        setError('Connection cancelled');
      } else {
        setError(msg || 'Failed to connect');
      }
      toast.error('Connection failed', { description: err.message });
    } finally {
      setConnecting(false);
    }
  };

  const handleCopy = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (state === 'loading') {
    return (
      <div ref={containerRef} className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <div className="size-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        Initializing Freighter...
      </div>
    );
  }

  if (state === 'installing') {
    return (
      <div ref={containerRef} className="text-center space-y-4 py-6">
        <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center ring-1 ring-white/[0.04] mx-auto">
          <Plugs weight="light" className="size-6 text-muted-foreground/50" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-destructive">Freighter not detected</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Install the{' '}
            <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-2">
              Freighter browser extension
            </a>
            , set it to <span className="font-mono text-[11px] text-primary">Testnet</span>, and refresh.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={detect}>
          <ArrowClockwise weight="bold" className="size-3.5 mr-1.5" />
          Try Again
        </Button>
      </div>
    );
  }

  if (publicKey) {
    return (
      <div ref={containerRef} className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="gap-2 px-3 py-1.5 text-sm font-mono">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.35)]" />
          {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
        </Badge>
        <button
          onClick={handleCopy}
          className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label={copied ? 'Copied' : 'Copy address'}
        >
          {copied ? <Check weight="bold" className="size-3.5 text-emerald-400" /> : <CopySimple weight="bold" className="size-3.5" />}
        </button>
        <a
          href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
          aria-label="View on StellarExpert"
        >
          <Eye weight="bold" className="size-3.5" />
        </a>
        <Button variant="ghost" size="xs" onClick={onDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-3 py-1">
      <Button onClick={handleConnect} disabled={connecting} className="gap-2 w-full h-10">
        {connecting ? (
          <>
            <div className="size-4 rounded-full border-2 border-background/50 border-t-background animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet weight="bold" className="size-4" />
            Connect Freighter Wallet
          </>
        )}
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
      {state === 'disconnected' && !error && (
        <p className="text-xs text-muted-foreground/60">
          Freighter detected. Click connect to allow localhost access.
        </p>
      )}
    </div>
  );
}
