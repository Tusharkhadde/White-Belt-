import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

gsap.registerPlugin(useGSAP);

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

function Countdown({ unlockDate, createdAt }: { unlockDate: string; createdAt: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const target = new Date(unlockDate).getTime();
  const total = Math.max(1, target - createdAt);
  const elapsed = Math.max(0, now - createdAt);
  const diff = Math.max(0, target - now);
  const unlocked = diff === 0;
  const progress = Math.min(100, (elapsed / total) * 100);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (unlocked) {
    return (
      <div className="text-center py-2">
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-500 text-white border-0 text-xs px-3 py-1">
          <svg className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          Unlocked
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-center">
        {[
          { val: days, label: 'days' },
          { val: hours, label: 'hrs' },
          { val: minutes, label: 'min' },
          { val: seconds, label: 'sec' },
        ].map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums bg-secondary/50 rounded-lg px-2 py-1 min-w-[3rem]">
                {String(unit.val).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{unit.label}</div>
            </div>
            {i < 3 && <span className="text-lg text-muted-foreground/50 mb-4">:</span>}
          </div>
        ))}
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function CapsuleList({ capsules }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const items = listRef.current?.querySelectorAll('.capsule-item');
    if (items) {
      gsap.from(items, {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
      });
    }
  }, { dependencies: [capsules.length], scope: listRef });

  if (capsules.length === 0) return null;

  const totalLocked = capsules.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);

  return (
    <div ref={listRef} className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Time Capsules</h3>
        <Badge variant="outline" className="text-xs">
          {totalLocked.toFixed(2)} XLM locked
        </Badge>
      </div>
      {capsules.map((c) => (
        <Card
          key={c.id}
          className="capsule-item bg-card/50 backdrop-blur border-primary/10 card-hover"
        >
          <CardContent className="p-4 space-y-4">
            <Countdown unlockDate={c.unlockDate} createdAt={c.createdAt} />
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-foreground/40">To</span>
                <p className="font-mono mt-0.5">{c.recipient.slice(0, 6)}...{c.recipient.slice(-4)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-foreground/40">Amount</span>
                <p className="font-mono mt-0.5 text-foreground/80">{c.amount} XLM</p>
              </div>
              {c.message && (
                <div className="col-span-2">
                  <span className="text-[10px] uppercase tracking-wider text-foreground/40">Message</span>
                  <p className="mt-0.5 text-foreground/70 italic">"{c.message}"</p>
                </div>
              )}
              <div className="col-span-2 pt-1 border-t border-border/30">
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${c.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                >
                  {c.hash.slice(0, 16)}...
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
