import { useState, useEffect, useCallback, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { LockKey, ArrowClockwise } from '@phosphor-icons/react';
import { getAllBalances, fundWithFriendbot, getRecentTransactions } from '@/utils/stellar';
import Starfield from '@/components/Starfield';
import WalletConnector from '@/components/WalletConnector';
import CreateCapsule from '@/components/CreateCapsule';
import VaultDashboard from '@/components/VaultDashboard';
import CapsuleList from '@/components/CapsuleList';
import FeatureHighlights from '@/components/FeatureHighlights';
import SorobanBadge from '@/components/SorobanBadge';
import ClaimableBalances from '@/components/ClaimableBalances';
import CollaborativeVault from '@/components/CollaborativeVault';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Capsule, Activity, TransactionRecord, AssetBalance } from '@/types';
import { CAPSULE_STORAGE_KEY, loadCapsules, loadActivities, addActivity, getErrorMessage, isCapsuleUnlocked, capsuleProgress, WALLET_STORAGE_KEY } from '@/types';

gsap.registerPlugin(useGSAP);

function normalizeCapsule(capsule: Capsule): Capsule {
  return {
    ...capsule,
    title: capsule.title || 'Saved capsule',
    goal: capsule.goal || 'Future savings goal',
    targetAmount: capsule.targetAmount || capsule.amount,
    encryptedMessage: capsule.encryptedMessage || '',
    futureLetter: capsule.futureLetter || 'This capsule marks a commitment to a future goal.',
    collaborators: capsule.collaborators || [],
  };
}

function App() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [funding, setFunding] = useState(false);
  const [capsules, setCapsules] = useState<Capsule[]>(() => loadCapsules().map(normalizeCapsule));
  const [activities, setActivities] = useState<Activity[]>(loadActivities);
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

  const fetchTransactions = useCallback(async () => {
    if (!publicKey) return;
    try {
      setTransactions(await getRecentTransactions(publicKey));
    } catch {
      setTransactions([]);
    }
  }, [publicKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchBalances();
      fetchTransactions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchBalances, fetchTransactions]);

  useEffect(() => {
    localStorage.setItem(CAPSULE_STORAGE_KEY, JSON.stringify(capsules));
  }, [capsules]);

  useEffect(() => {
    capsules.forEach((capsule) => {
      if (!isCapsuleUnlocked(capsule)) return;

      const unlockActivity: Activity = {
        id: `act-unlock-${capsule.id}`,
        type: 'capsule_unlocked',
        description: `Capsule unlocked: ${capsule.title} (${capsule.amount} ${capsule.asset_code || 'XLM'})`,
        amount: capsule.amount,
        asset: capsule.asset_code || 'XLM',
        hash: capsule.hash,
        timestamp: new Date(capsule.unlockDate).getTime(),
      };

      const existing = loadActivities();
      const alreadyLogged = existing.some(
        (a) => a.id === unlockActivity.id
      );
      if (!alreadyLogged) {
        setActivities(addActivity(unlockActivity));
      }

      const progress = capsuleProgress(capsule);
      const milestones = [25, 50, 75, 100];
      milestones.forEach((threshold) => {
        if (progress >= threshold) {
          const milestoneActivity: Activity = {
            id: `act-milestone-${capsule.id}-${threshold}`,
            type: 'milestone',
            description: `Milestone reached: ${capsule.title} is at ${threshold}% of target`,
            amount: capsule.amount,
            asset: capsule.asset_code || 'XLM',
            timestamp: capsule.createdAt + (threshold / 100) * (new Date(capsule.unlockDate).getTime() - capsule.createdAt),
          };
          const alreadyMilestone = existing.some((a) => a.id === milestoneActivity.id);
          if (!alreadyMilestone) {
            setActivities(addActivity(milestoneActivity));
          }
        }
      });
    });
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
    setTransactions([]);
    localStorage.removeItem(WALLET_STORAGE_KEY);
  };

  const handleCapsuleCreated = (capsule: Capsule) => {
    setCapsules((prev) => [capsule, ...prev]);
    const activity: Activity = {
      id: `act-${Date.now()}`,
      type: 'capsule_sealed',
      description: `${capsule.title}: ${capsule.amount} ${capsule.asset_code || 'XLM'} sealed for ${capsule.goal}`,
      amount: capsule.amount,
      asset: capsule.asset_code || 'XLM',
      hash: capsule.hash,
      timestamp: Date.now(),
    };
    setActivities(addActivity(activity));
    fetchTransactions();
  };

  const handleFund = async () => {
    if (!publicKey) return;
    setFunding(true);
    try {
      const hash = await fundWithFriendbot(publicKey);
      await fetchBalances();
      await fetchTransactions();
      const activity: Activity = {
        id: `act-${Date.now()}`,
        type: 'funded',
        description: 'Account funded with 10,000 XLM',
        amount: '10000',
        asset: 'XLM',
        hash,
        timestamp: Date.now(),
      };
      setActivities(addActivity(activity));
      toast.success('Funded with 10,000 XLM', {
        description: `Hash: ${hash.slice(0, 16)}...`,
      });
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      if (message.includes('already exists') || message.includes('exists')) {
        toast.error('Already funded');
      } else {
        toast.error('Funding failed', { description: message });
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
          <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <LockKey weight="bold" className="size-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">FutureVault</h1>
                  <p className="text-base text-muted-foreground">
                    Goal-based savings on the Stellar blockchain
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {!publicKey && (
            <div className="mb-8">
              <FeatureHighlights />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[410px_1fr] gap-8 items-start">
            <div ref={mainRef} className="space-y-5">
              <Card className="backdrop-blur-xl bg-card/50 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <CardContent className="p-6 space-y-5">
                  <WalletConnector
                    publicKey={publicKey}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                  />

                  {publicKey && (
                    <div className="space-y-5 pt-5 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground font-semibold tracking-wide">XLM Balance</span>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold tabular-nums tracking-tight">
                            {balance !== null
                              ? `${parseFloat(balance).toFixed(4)} XLM`
                              : <span className="text-base text-muted-foreground">Fetching...</span>
                            }
                          </span>
                          <button
                            onClick={() => {
                              fetchBalances();
                              fetchTransactions();
                            }}
                            className="size-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            aria-label="Refresh balance"
                          >
                            <ArrowClockwise weight="bold" className="size-4" />
                          </button>
                        </div>
                      </div>

                      {isPoor && (
                        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                          <p className="text-sm text-amber-400/80 font-medium">Need testnet XLM?</p>
                          <Button
                            onClick={handleFund}
                            disabled={funding}
                            size="sm"
                            variant="outline"
                            className="border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-9 text-sm font-semibold"
                          >
                            {funding ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                Funding...
                              </>
                            ) : (
                              'Get 10,000 XLM'
                            )}
                          </Button>
                        </div>
                      )}

                      {capsules.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{capsules.length} capsule{capsules.length !== 1 ? 's' : ''}</span>
                          <span className="text-muted-foreground/30">/</span>
                          <span>{transactions.length} recent on-chain event{transactions.length !== 1 ? 's' : ''}</span>
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

              {publicKey && <SorobanBadge />}
            </div>

            <div className="min-w-0 space-y-6">
              {publicKey && capsules.length > 0 && (
                <>
                  <VaultDashboard
                    capsules={capsules}
                    balances={balances}
                    activities={activities}
                    transactions={transactions}
                  />
                  <AnalyticsCharts capsules={capsules} balances={balances} />
                  <ClaimableBalances capsules={capsules} />
                  <CollaborativeVault capsules={capsules} publicKey={publicKey} />
                  <CapsuleList capsules={capsules} publicKey={publicKey} />
                </>
              )}

              {publicKey && capsules.length === 0 && hasBalance && (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <div className="size-20 rounded-2xl bg-muted/50 flex items-center justify-center ring-1 ring-white/[0.04] mb-6">
                    <LockKey weight="light" className="size-9 text-muted-foreground/40" />
                  </div>
                  <p className="text-xl font-bold mb-2">No capsules yet</p>
                  <p className="text-sm text-muted-foreground/50 max-w-md leading-relaxed">
                    Create your first savings capsule on the left. It takes about 30 seconds to lock your first assets on Stellar.
                  </p>
                </div>
              )}

              {!publicKey && (
                <div className="space-y-6">
                  <div className="rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] p-8 text-center space-y-4">
                    <p className="text-base text-muted-foreground/70 leading-relaxed max-w-md mx-auto">
                      Connect your wallet or sign in with a passkey to start creating time-locked savings capsules on Stellar.
                    </p>
                    <p className="text-sm text-muted-foreground/40">
                      New to Stellar? Install Freighter, get some testnet XLM, and you're ready to go.
                    </p>
                  </div>
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
