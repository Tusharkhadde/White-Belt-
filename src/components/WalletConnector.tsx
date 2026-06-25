import { useState, useEffect, useCallback, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Wallet, CopySimple, Check, ArrowClockwise, Plugs, Eye, Info } from '@phosphor-icons/react';
import { isFreighterInstalled, isFreighterConnected, connectWallet } from '@/utils/stellar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getErrorMessage, WALLET_STORAGE_KEY } from '@/types';
import PasskeyLogin from './PasskeyLogin';

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
    const installed = await isFreighterInstalled();
    if (!installed) {
      setState('installing');
      return;
    }

    const storedPk = localStorage.getItem(WALLET_STORAGE_KEY);
    if (storedPk) {
      const connected = await isFreighterConnected();
      if (connected) {
        onConnect(storedPk);
        setState('connected');
        return;
      }
      localStorage.removeItem(WALLET_STORAGE_KEY);
    }

    const connected = await isFreighterConnected();
    setState(connected ? 'connected' : 'disconnected');
  }, [onConnect]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (publicKey) {
        setState('connected');
        return;
      }
      detect();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [detect, publicKey]);

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
      localStorage.setItem(WALLET_STORAGE_KEY, pk);
      onConnect(pk);
      setState('connected');
      toast.success('Wallet connected', {
        description: `${pk.slice(0, 4)}...${pk.slice(-4)}`,
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg.includes('reject') || msg.includes('deny') || msg.includes('cancel')) {
        setError('Connection cancelled');
      } else if (msg.includes('timed out') || msg.includes('timeout')) {
        setError('Timed out — make sure the Freighter popup is open and approve the request.');
      } else if (msg.includes('blocked') || msg.includes('popup')) {
        setError('Popup was blocked. Please allow popups for this site and try again.');
      } else {
        setError(msg || 'Failed to connect');
      }
      toast.error('Connection failed', { description: msg });
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
      <div ref={containerRef} className="flex items-center gap-3 text-muted-foreground text-base py-3">
        <div className="size-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        Checking for Freighter wallet...
      </div>
    );
  }

  if (state === 'installing') {
    return (
      <div ref={containerRef} className="text-center space-y-5 py-8">
        <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center ring-1 ring-white/[0.04] mx-auto">
          <Plugs weight="light" className="size-7 text-muted-foreground/50" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-bold text-destructive">Freighter Wallet Not Found</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            You need the Freighter browser extension to connect your Stellar wallet.
            It's free and takes 30 seconds to install.
          </p>
        </div>
        <div className="space-y-3">
          <a
            href="https://freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Install Freighter
            <span className="text-xs opacity-70">Opens in new tab</span>
          </a>
          <p className="text-xs text-muted-foreground/60">
            After installing, set it to <span className="font-mono text-primary">Testnet</span> and refresh this page
          </p>
        </div>
        <Button variant="outline" size="lg" onClick={detect}>
          <ArrowClockwise weight="bold" className="size-4 mr-2" />
          Refresh & Check Again
        </Button>
      </div>
    );
  }

  if (publicKey) {
    return (
      <div ref={containerRef} className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.35)]" />
          Wallet Connected
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-2 px-4 py-2 text-sm font-mono">
            {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
          </Badge>
          <button
            onClick={handleCopy}
            className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label={copied ? 'Copied' : 'Copy address'}
          >
            {copied ? <Check weight="bold" className="size-4 text-emerald-400" /> : <CopySimple weight="bold" className="size-4" />}
          </button>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
            aria-label="View on StellarExpert"
          >
            <Eye weight="bold" className="size-4" />
          </a>
          <Button variant="ghost" size="sm" onClick={onDisconnect}>
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="space-y-2">
        <p className="text-lg font-bold">Connect Your Wallet</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Choose how you'd like to sign in. Both methods are secure and keep your data private.
        </p>
      </div>

      <Button onClick={handleConnect} disabled={connecting} className="gap-2 w-full h-12 text-base font-semibold">
        {connecting ? (
          <>
            <div className="size-5 rounded-full border-2 border-background/50 border-t-background animate-spin" />
            Waiting for Freighter approval...
          </>
        ) : (
          <>
            <Wallet weight="bold" className="size-5" />
            Connect Freighter Wallet
          </>
        )}
      </Button>

      <PasskeyLogin onConnect={(pk) => { onConnect(pk); setState('connected'); }} />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {state === 'disconnected' && !error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <Info weight="bold" className="size-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">New to Stellar?</span>{' '}
            Install Freighter from <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">freighter.app</a>, create a wallet, and switch to Testnet. Then come back and click connect.
          </p>
        </div>
      )}
    </div>
  );
}
