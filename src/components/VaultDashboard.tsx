import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Clock, CoinVertical, LockSimple, Alarm, Coins } from '@phosphor-icons/react';
import type { Capsule, AssetBalance } from '@/types';
import ActivityFeed from './ActivityFeed';
import type { Activity } from '@/types';

gsap.registerPlugin(useGSAP);

interface Props {
  capsules: Capsule[];
  balances: AssetBalance[];
  activities: Activity[];
}

function AnimatedValue({ value, suffix = '', decimals = 2 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!ref.current) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: () => setDisplay(obj.val.toFixed(decimals)),
    });
  }, [value, decimals]);

  return (
    <span ref={ref} className="tabular-nums tracking-tight">
      {display}{suffix}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  gradient,
  decimals = 2,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  gradient: string;
  decimals?: number;
}) {
  return (
    <div className="rounded-xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-5 space-y-3 transition-all duration-300 hover:ring-white/[0.10] hover:bg-card/40">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">{label}</span>
        <div className={`size-8 rounded-lg flex items-center justify-center ring-1 ${gradient}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-semibold">
        <AnimatedValue value={value} suffix={suffix} decimals={decimals} />
      </div>
    </div>
  );
}

function AssetBreakdown({ balances }: { balances: AssetBalance[] }) {
  const nonNative = balances.filter((b) => b.asset_type !== 'native' && parseFloat(b.balance) > 0);
  const xlmBalance = balances.find((b) => b.asset_type === 'native');

  if (nonNative.length === 0 && (!xlmBalance || parseFloat(xlmBalance.balance) === 0)) return null;

  return (
    <div className="rounded-xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-5 space-y-3 transition-all duration-300 hover:ring-white/[0.10] hover:bg-card/40 col-span-full">
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
        <Coins weight="bold" className="size-3.5" />
        Portfolio
      </div>
      <div className="space-y-2">
        {xlmBalance && parseFloat(xlmBalance.balance) > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-400" />
              <span className="font-medium">XLM</span>
            </div>
            <span className="tabular-nums text-muted-foreground">{parseFloat(xlmBalance.balance).toFixed(4)}</span>
          </div>
        )}
        {nonNative.map((b) => (
          <div key={b.asset_code} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-blue-400" />
              <span className="font-medium">{b.asset_code}</span>
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {b.asset_issuer?.slice(0, 6)}...
              </span>
            </div>
            <span className="tabular-nums text-muted-foreground">{parseFloat(b.balance).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NextUnlockCard({ capsules }: { capsules: Capsule[] }) {
  const now = Date.now();
  const upcoming = capsules
    .map((c) => ({ ...c, target: new Date(c.unlockDate).getTime() }))
    .filter((c) => c.target > now)
    .sort((a, b) => a.target - b.target);

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const diff = next.target - now;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);

  return (
    <div className="rounded-xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-5 space-y-3 transition-all duration-300 hover:ring-white/[0.10] hover:bg-card/40 col-span-full sm:col-span-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
        <Alarm weight="bold" className="size-3.5" />
        Next Unlock
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-lg font-semibold tabular-nums tracking-tight">
            {next.amount} {next.asset_code || 'XLM'}
          </p>
          <p className="text-sm text-muted-foreground/70 font-mono">
            {next.recipient.slice(0, 6)}...{next.recipient.slice(-4)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {days}d {hours}h
          </p>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">remaining</p>
        </div>
      </div>
      {next.message && (
        <p className="text-xs text-muted-foreground/50 italic leading-relaxed border-t border-border/20 pt-2">
          &ldquo;{next.message}&rdquo;
        </p>
      )}
    </div>
  );
}

export default function VaultDashboard({ capsules, balances, activities }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const cards = gridRef.current?.querySelectorAll('.stat-card');
    if (cards) {
      gsap.from(cards, {
        y: 24,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }
  }, { scope: gridRef, dependencies: [capsules.length] });

  const totalLocked = capsules.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);
  const unlocked = capsules.filter((c) => new Date(c.unlockDate).getTime() <= Date.now()).length;
  const locked = capsules.length - unlocked;
  const avgDuration = capsules.length > 0
    ? capsules.reduce((sum, c) => sum + (new Date(c.unlockDate).getTime() - c.createdAt), 0) / capsules.length
    : 0;
  const avgDays = Math.round(avgDuration / 86400000);

  return (
    <div ref={gridRef} className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <StatCard
            icon={<CoinVertical weight="bold" className="size-4 text-emerald-400" />}
            label="Total Locked"
            value={totalLocked}
            suffix=" XLM"
            gradient="ring-emerald-500/20 bg-emerald-500/5"
            decimals={2}
          />
        </div>
        <div className="stat-card">
          <StatCard
            icon={<LockSimple weight="bold" className="size-4 text-blue-400" />}
            label="Active Capsules"
            value={locked}
            gradient="ring-blue-500/20 bg-blue-500/5"
            decimals={0}
          />
        </div>
        <div className="stat-card">
          <StatCard
            icon={<Clock weight="bold" className="size-4 text-amber-400" />}
            label="Unlocked"
            value={unlocked}
            gradient="ring-amber-500/20 bg-amber-500/5"
            decimals={0}
          />
        </div>
        <div className="stat-card">
          <StatCard
            icon={<Alarm weight="bold" className="size-4 text-purple-400" />}
            label="Avg. Lock Duration"
            value={avgDays}
            suffix=" days"
            gradient="ring-purple-500/20 bg-purple-500/5"
            decimals={0}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AssetBreakdown balances={balances} />
        {capsules.length > 1 && <NextUnlockCard capsules={capsules} />}
      </div>

      <ActivityFeed activities={activities} />
    </div>
  );
}
