import { useState, useEffect, useCallback, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { getXlmBalance, fundWithFriendbot } from '@/utils/stellar';
import Starfield from '@/components/Starfield';
import WalletConnector from '@/components/WalletConnector';
import CreateCapsule from '@/components/CreateCapsule';
import CapsuleList from '@/components/CapsuleList';
import type { Capsule } from '@/components/CapsuleList';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

gsap.registerPlugin(useGSAP);

const STORAGE_KEY = 'stellar-capsules';

function loadCapsules(): Capsule[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function App() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [funding, setFunding] = useState(false);
  const [capsules, setCapsules] = useState<Capsule[]>(loadCapsules);
  const headerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const bal = await getXlmBalance(publicKey);
      setBalance(bal);
      return bal;
    } catch {
      setBalance(null);
      return null;
    }
  }, [publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
  }, [capsules]);

  useGSAP(() => {
    gsap.from(headerRef.current, {
      y: -30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    });
  }, { scope: headerRef });

  useGSAP(() => {
    if (publicKey) {
      gsap.from(mainRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: 'power2.out',
      });
    }
  }, { dependencies: [publicKey], scope: mainRef });

  const handleConnect = (pk: string) => {
    setPublicKey(pk);
  };

  const handleDisconnect = () => {
    setPublicKey(null);
    setBalance(null);
  };

  const handleCapsuleCreated = (capsule: Capsule) => {
    setCapsules((prev) => [capsule, ...prev]);
  };

  const handleFund = async () => {
    if (!publicKey) return;
    setFunding(true);
    try {
      const hash = await fundWithFriendbot(publicKey);
      toast.success('Funded with 10,000 XLM!', {
        description: `Hash: ${hash.slice(0, 16)}...`,
      });
      await fetchBalance();
    } catch (err: any) {
      if (err.message?.includes('already exists') || err.message?.includes('exists')) {
        toast.error('Already funded');
      } else {
        toast.error('Funding failed', { description: err.message });
      }
    } finally {
      setFunding(false);
    }
  };

  const totalLocked = capsules.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);
  const hasBalance = balance !== null && parseFloat(balance) > 0;
  const isPoor = balance !== null && parseFloat(balance) < 1;

  return (
    <div className="min-h-screen relative">
      <Starfield />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-5">
        <div ref={headerRef} className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Time Capsule
            </span>
          </h1>
          <p className="text-muted-foreground text-xs">
            Seal XLM with a message on the Stellar Testnet
          </p>
        </div>

        <Card ref={mainRef} className="bg-card/50 backdrop-blur border-primary/10 glow">
          <CardContent className="p-4 space-y-3">
            <WalletConnector
              publicKey={publicKey}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />

            {publicKey && (
              <div className="space-y-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">XLM Balance</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tabular-nums">
                      {balance !== null
                        ? `${parseFloat(balance).toFixed(4)} XLM`
                        : <span className="text-sm text-muted-foreground animate-pulse">Fetching...</span>
                      }
                    </span>
<button
  onClick={fetchBalance}
  className="text-muted-foreground hover:text-foreground transition-colors"
  aria-label="Refresh balance"
>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>

                {(isPoor || balance === '0') && (
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400">Need testnet XLM?</p>
                    <Button
                      onClick={handleFund}
                      disabled={funding}
                      size="sm"
                      variant="outline"
                      className="border-amber-500/30 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 text-[11px]"
                    >
                      {funding ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                          Funding...
                        </>
                      ) : (
                        'Get 10,000 XLM'
                      )}
                    </Button>
                  </div>
                )}

                {capsules.length > 0 && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{capsules.length} capsule{capsules.length !== 1 ? 's' : ''}</span>
                    <span className="text-border">|</span>
                    <span>{totalLocked.toFixed(2)} XLM locked</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {publicKey && <CreateCapsule publicKey={publicKey} onCapsuleCreated={handleCapsuleCreated} onBalanceRefresh={fetchBalance} />}

        {publicKey && capsules.length > 0 && (
          <>
            <Separator className="bg-primary/10" />
            <CapsuleList capsules={capsules} />
          </>
        )}

        {publicKey && capsules.length === 0 && hasBalance && (
          <div className="text-center py-16 space-y-3 fade-in">
            <svg className="h-16 w-16 mx-auto text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-muted-foreground">No time capsules yet</p>
            <p className="text-sm text-muted-foreground/60">Create your first capsule above to seal XLM in time</p>
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}

export default App;
