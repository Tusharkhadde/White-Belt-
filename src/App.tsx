import { useState, useEffect, useCallback, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { LockKey } from '@phosphor-icons/react';
import { getAllBalances, fundWithFriendbot } from '@/utils/stellar';
import type { AssetBalance } from '@/utils/stellar';
import Starfield from '@/components/Starfield';
import WalletConnector from '@/components/WalletConnector';
import CreateCapsule from '@/components/CreateCapsule';
import VaultDashboard from '@/components/VaultDashboard';
import CapsuleList from '@/components/CapsuleList';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Capsule, Activity } from '@/types';
import { CAPSULE_STORAGE_KEY, loadCapsules, loadActivities, addActivity } from '@/types';

gsap.registerPlugin(useGSAP);

function App() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [funding, setFunding] = useState(false);
  const [capsules, setCapsules] = useState<Capsule[]>(loadCapsules);
  const [activities, setActivities] = useState<Activity[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const fetchBalances = useCallback(async () => {
    if (!publicKey) return;
    try {
      const b = await getAllBalances(publicKey);
      setBalances(b);
    } catch {
      setBalances([]);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchBalances();
    setActivities(loadActivities());
  }, [fetchBalances]);

  useEffect(() => {
    localStorage.setItem(CAPSULE_STORAGE_KEY, JSON.stringify(capsules));
  }, [capsules]);

  useGSAP(() => {
    gsap.from(headerRef.current, {
      y: -20,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    });
  }, { scope: headerRef });

  useGSAP(() => {
    if (publicKey) {
      gsap.from(mainRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        delay: 0.15,
        ease: 'power2.out',
      });
    }
  }, { dependencies: [publicKey], scope: mainRef });

  const handleConnect = (pk: string) => {
    setPublicKey(pk);
    const activity: Activity = {
      id: `act-${Date.now()}`,
      type: 'wallet_connected',
      description: `Wallet connected: ${pk.slice(0, 4)}...${pk.slice(-4)}`,
      timestamp: Date.now(),
    };
    setActivities(addActivity(activity));
  };

  const handleDisconnect = () => {
    setPublicKey(null);
    setBalances([]);
  };

  const handleCapsuleCreated = (capsule: Capsule) => {
    setCapsules((prev) => [capsule, ...prev]);
    const activity: Activity = {
      id: `act-${Date.now()}`,
      type: 'capsule_sealed',
      description: `${capsule.amount} ${capsule.asset_code || 'XLM'} sealed → ${capsule.recipient.slice(0, 4)}...${capsule.recipient.slice(-4)}`,
      amount: capsule.amount,
      asset: capsule.asset_code || 'XLM',
      timestamp: Date.now(),
    };
    setActivities(addActivity(activity));
  };

  const handleFund = async () => {
    if (!publicKey) return;
    setFunding(true);
    try {
      const hash = await fundWithFriendbot(publicKey);
      await fetchBalances();
      const activity: Activity = {
        id: `act-${Date.now()}`,
        type: 'funded',
        description: 'Account funded with 10,000 XLM',
        amount: '10000',
        asset: 'XLM',
        timestamp: Date.now(),
      };
      setActivities(addActivity(activity));
      toast.success('Funded with 10,000 XLM!', {
        description: `Hash: ${hash.slice(0, 16)}...`,
      });
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

  const balance = balances.find((b) => b.asset_type === 'native')?.balance ?? null;
  const hasBalance = balance !== null && parseFloat(balance) > 0;
  const isPoor = balance !== null && parseFloat(balance) < 1;

  return (
    <div className="min-h-[100dvh] relative">
      <Starfield />

      <div className="relative z-10">
        <div ref={headerRef} className="border-b border-border/40">
          <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <LockKey weight="bold" className="size-5 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Stellar Vault</h1>
              </div>
              <p className="text-sm text-muted-foreground pl-12">
                Multi-asset time-locked capsules on the Stellar testnet
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
            <div ref={mainRef} className="space-y-5">
              <Card className="backdrop-blur-xl bg-card/50 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <CardContent className="p-5 space-y-4">
                  <WalletConnector
                    publicKey={publicKey}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                  />

                  {publicKey && (
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">XLM Balance</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold tabular-nums tracking-tight">
                            {balance !== null
                              ? `${parseFloat(balance).toFixed(4)} XLM`
                              : <span className="text-sm text-muted-foreground">Fetching...</span>
                            }
                          </span>
                          <button
                            onClick={fetchBalances}
                            className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            aria-label="Refresh balance"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {isPoor && (
                        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                          <p className="text-xs text-amber-400/80">Need testnet XLM?</p>
                          <Button
                            onClick={handleFund}
                            disabled={funding}
                            size="sm"
                            variant="outline"
                            className="border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-7 text-[11px]"
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
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{capsules.length} capsule{capsules.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {publicKey && (
                <CreateCapsule
                  publicKey={publicKey}
                  onCapsuleCreated={handleCapsuleCreated}
                  onBalanceRefresh={fetchBalances}
                  balances={balances}
                />
              )}
            </div>

            <div className="min-w-0 space-y-6">
              {publicKey && capsules.length > 0 && (
                <>
                  <VaultDashboard capsules={capsules} balances={balances} activities={activities} />
                  <CapsuleList capsules={capsules} />
                </>
              )}

              {publicKey && capsules.length === 0 && hasBalance && (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center ring-1 ring-white/[0.04] mb-5">
                    <LockKey weight="light" className="size-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">No time capsules yet</p>
                  <p className="text-xs text-muted-foreground/50 max-w-xs">
                    Create your first capsule to seal assets with a message for the future
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
