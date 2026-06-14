import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

export interface Capsule {
  id: string;
  recipient: string;
  amount: string;
  message: string;
  unlockDate: string;
  hash: string;
  createdAt: number;
}

interface Props {
  capsules: Capsule[];
}

function Countdown({ unlockDate }: { unlockDate: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const target = new Date(unlockDate).getTime();
  const diff = Math.max(0, target - now);
  const unlocked = diff === 0;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);



  return (
    <div className="space-y-2">
      {unlocked ? (
        <Badge className="bg-green-600 hover:bg-green-600 text-xs">Unlocked</Badge>
      ) : (
        <>
          <div className="flex gap-2 justify-center text-sm font-mono">
            <span className="text-center">
              <span className="block text-lg font-bold">{String(days).padStart(2, '0')}</span>
              <span className="text-[10px] text-muted-foreground">days</span>
            </span>
            <span className="text-lg text-muted-foreground">:</span>
            <span className="text-center">
              <span className="block text-lg font-bold">{String(hours).padStart(2, '0')}</span>
              <span className="text-[10px] text-muted-foreground">hrs</span>
            </span>
            <span className="text-lg text-muted-foreground">:</span>
            <span className="text-center">
              <span className="block text-lg font-bold">{String(minutes).padStart(2, '0')}</span>
              <span className="text-[10px] text-muted-foreground">min</span>
            </span>
            <span className="text-lg text-muted-foreground">:</span>
            <span className="text-center">
              <span className="block text-lg font-bold">{String(seconds).padStart(2, '0')}</span>
              <span className="text-[10px] text-muted-foreground">sec</span>
            </span>
          </div>
          <div className="h-1 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, ((Date.now() - (target - 86400000)) / 86400000) * 100)}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function CapsuleList({ capsules }: Props) {
  if (capsules.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Time Capsules</h3>
      {capsules.map((c) => (
        <Card key={c.id} className="bg-card/50 backdrop-blur border-primary/10">
          <CardContent className="p-4 space-y-3">
            <Countdown unlockDate={c.unlockDate} />
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="text-foreground/60">To:</span> {c.recipient.slice(0, 8)}...{c.recipient.slice(-4)}</p>
              <p><span className="text-foreground/60">Amount:</span> {c.amount} XLM</p>
              {c.message && <p><span className="text-foreground/60">Message:</span> "{c.message}"</p>}
              <p className="truncate"><span className="text-foreground/60">Tx:</span> {c.hash.slice(0, 16)}...</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
