import { useRef, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Coins, LockSimple, ArrowUpRight, Clock, Info } from '@phosphor-icons/react';
import type { Capsule } from '@/types';
import { isCapsuleUnlocked, getCapsuleAsset } from '@/types';

interface Props {
  capsules: Capsule[];
}

export default function ClaimableBalances({ capsules }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const claimable = useMemo(() => {
    return capsules.map((c) => {
      const unlocked = isCapsuleUnlocked(c);
      const target = new Date(c.unlockDate).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);
      return { ...c, unlocked, diff, target };
    });
  }, [capsules]);

  const claimableCount = claimable.filter((c) => c.unlocked).length;
  const lockedCount = claimable.length - claimableCount;

  useGSAP(() => {
    if (ref.current) {
      gsap.from(ref.current, {
        y: 16,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
      });
    }
  }, { scope: ref });

  if (capsules.length === 0) return null;

  return (
    <div ref={ref} className="rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] p-6 space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-semibold tracking-wide">
            <Coins weight="bold" className="size-4" />
            Claimable Balances
          </div>
          <div className="flex items-center gap-2">
            {lockedCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-amber-400/70 bg-amber-500/10 px-2.5 py-1 rounded-full font-medium">
                <LockSimple weight="bold" className="size-3" />
                {lockedCount} locked
              </span>
            )}
            {claimableCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400/70 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">
                <ArrowUpRight weight="bold" className="size-3" />
                {claimableCount} claimable
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground/50">
          Your capsule balances on Stellar. Claimable balances unlock at the set date.
        </p>
      </div>

      <div className="space-y-3">
        {claimable.slice(0, 5).map((item) => {
          const days = Math.floor(item.diff / 86400000);
          const hours = Math.floor((item.diff % 86400000) / 3600000);
          const asset = getCapsuleAsset(item);

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                item.unlocked
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-border/30 bg-background/20'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center ring-1 shrink-0 ${
                    item.unlocked
                      ? 'ring-emerald-500/20 bg-emerald-500/10'
                      : 'ring-amber-500/20 bg-amber-500/10'
                  }`}
                >
                  {item.unlocked ? (
                    <ArrowUpRight weight="bold" className="size-5 text-emerald-400" />
                  ) : (
                    <LockSimple weight="bold" className="size-5 text-amber-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold truncate">{item.title}</p>
                  <p className="text-sm text-muted-foreground/60">
                    {item.amount} {asset}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                {item.unlocked ? (
                  <span className="text-sm text-emerald-400 font-bold">Ready to claim</span>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground/60">
                    <Clock weight="bold" className="size-4" />
                    {days}d {hours}h
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <Info weight="bold" className="size-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          Claimable balances are Stellar-native escrow. Your funds are locked on-chain until the unlock date — no one can access them early.
        </p>
      </div>
    </div>
  );
}
