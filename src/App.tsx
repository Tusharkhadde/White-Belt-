import { useState, useEffect, useCallback } from 'react';
import { getXlmBalance } from '@/utils/stellar';
import WalletConnector from '@/components/WalletConnector';
import CreateCapsule from '@/components/CreateCapsule';
import CapsuleList from '@/components/CapsuleList';
import type { Capsule } from '@/components/CapsuleList';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  const [capsules, setCapsules] = useState<Capsule[]>(loadCapsules);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const bal = await getXlmBalance(publicKey);
      setBalance(bal);
    } catch {
      setBalance(null);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
  }, [capsules]);

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

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <svg className="h-8 w-8 text-primary glow-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-3xl font-bold glow-text">Time Capsule</h1>
          </div>
          <p className="text-muted-foreground text-sm">Send XLM sealed until a future date on the Stellar Testnet</p>
        </div>

        {/* Wallet + Balance */}
        <Card className="bg-card/50 backdrop-blur border-primary/10 glow">
          <CardContent className="p-4 space-y-4">
            <WalletConnector
              publicKey={publicKey}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
            {publicKey && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-sm text-muted-foreground">XLM Balance</span>
                <span className="text-xl font-bold">
                  {balance !== null ? `${parseFloat(balance).toFixed(4)} XLM` : (
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Capsule */}
        {publicKey && (
          <CreateCapsule
            publicKey={publicKey}
            onCapsuleCreated={handleCapsuleCreated}
            onBalanceRefresh={fetchBalance}
          />
        )}

        {/* Capsules List */}
        {publicKey && capsules.length > 0 && (
          <>
            <Separator className="bg-primary/10" />
            <CapsuleList capsules={capsules} />
          </>
        )}

        {/* Empty State */}
        {publicKey && capsules.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <svg className="h-12 w-12 mx-auto text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-muted-foreground text-sm">No time capsules yet. Create your first one above!</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground/40">
          Stellar Testnet · White Belt Level
        </p>
      </div>
    </div>
  );
}

export default App;
