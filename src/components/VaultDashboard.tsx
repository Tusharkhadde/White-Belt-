import { useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  Alarm,
  ChartPieSlice,
  Clock,
  CoinVertical,
  Info,
  LockSimple,
  Medal,
  Sparkle,
  TrendUp,
} from '@phosphor-icons/react';
import type { Capsule, AssetBalance, Activity, TransactionRecord, Achievement } from '@/types';
import { capsuleProgress, getCapsuleAsset, isCapsuleUnlocked } from '@/types';
import ActivityFeed from './ActivityFeed';

gsap.registerPlugin(useGSAP);

interface Props {
  capsules: Capsule[];
  balances: AssetBalance[];
  activities: Activity[];
  transactions: TransactionRecord[];
}

function AnimatedValue({ value, suffix = '', decimals = 2 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
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
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  gradient: string;
  decimals?: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-5 space-y-4 transition-all duration-300 hover:ring-white/[0.10] hover:bg-card/40">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground/60 font-semibold tracking-wide">{label}</span>
        <div className={`size-10 rounded-xl flex items-center justify-center ring-1 ${gradient}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold">
        <AnimatedValue value={value} suffix={suffix} decimals={decimals} />
      </div>
      {hint && <p className="text-xs text-muted-foreground/50">{hint}</p>}
    </div>
  );
}

function PortfolioPanel({ balances, capsules }: { balances: AssetBalance[]; capsules: Capsule[] }) {
  const lockedByAsset = useMemo(() => {
    return capsules.reduce<Record<string, number>>((acc, capsule) => {
      const asset = getCapsuleAsset(capsule);
      acc[asset] = (acc[asset] || 0) + parseFloat(capsule.amount || '0');
      return acc;
    }, {});
  }, [capsules]);

  const unlockedBalances = balances
    .filter((b) => parseFloat(b.balance) > 0)
    .map((b) => ({ asset: b.asset_code || 'XLM', amount: parseFloat(b.balance) }));

  const lockedEntries = Object.entries(lockedByAsset);
  const totalLockedUnits = lockedEntries.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <div className="rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] p-6 space-y-5 col-span-full">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-semibold tracking-wide">
          <ChartPieSlice weight="bold" className="size-4" />
          Asset Allocation
        </div>
        <span className="text-xs text-muted-foreground/50">Locked + wallet balances</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-medium">Locked in capsules</p>
          {lockedEntries.map(([asset, amount], index) => {
            const percent = totalLockedUnits > 0 ? (amount / totalLockedUnits) * 100 : 0;
            return (
              <div key={asset} className="space-y-2">
                <div className="flex items-center justify-between text-base">
                  <span className="font-semibold">{asset}</span>
                  <span className="tabular-nums text-muted-foreground">{amount.toFixed(asset === 'XLM' ? 4 : 2)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className={index % 2 === 0 ? 'h-full rounded-full bg-primary' : 'h-full rounded-full bg-blue-400'}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-medium">Available in wallet</p>
          {unlockedBalances.map((balance) => (
            <div key={balance.asset} className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2.5">
                <div className="size-2.5 rounded-full bg-emerald-400" />
                <span className="font-semibold">{balance.asset}</span>
              </div>
              <span className="tabular-nums text-muted-foreground">
                {balance.amount.toFixed(balance.asset === 'XLM' ? 4 : 2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NextUnlockCard({ capsules }: { capsules: Capsule[] }) {
  const [now] = useState(() => Date.now());
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
    <div className="rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] p-6 space-y-4 transition-all duration-300 hover:ring-white/[0.10] hover:bg-card/40 col-span-full sm:col-span-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-semibold tracking-wide">
        <Alarm weight="bold" className="size-4" />
        Next Unlock
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-2xl font-bold tabular-nums tracking-tight">
            {next.amount} {getCapsuleAsset(next)}
          </p>
          <p className="text-base text-muted-foreground/70">{next.title}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            {days}d {hours}h
          </p>
          <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">remaining</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground/50 leading-relaxed border-t border-border/20 pt-3">
        {next.goal}
      </p>
    </div>
  );
}

function AchievementPanel({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-semibold tracking-wide">
        <Medal weight="bold" className="size-4" />
        Milestones & Achievements
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`rounded-xl border p-4 transition-colors ${
              achievement.unlocked
                ? 'border-primary/20 bg-primary/5 text-foreground'
                : 'border-border/40 bg-muted/20 text-muted-foreground/60'
            }`}
          >
            <div className="flex items-center gap-2.5 text-base font-bold">
              <Sparkle weight="bold" className={achievement.unlocked ? 'size-4 text-primary' : 'size-4'} />
              {achievement.label}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed">{achievement.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionHistory({ transactions }: { transactions: TransactionRecord[] }) {
  if (transactions.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-semibold tracking-wide">
        <TrendUp weight="bold" className="size-4" />
        Stellar Activity
      </div>
      <div className="space-y-3">
        {transactions.slice(0, 6).map((tx) => (
          <a
            key={tx.id}
            href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-border/30 bg-background/20 p-4 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm text-foreground/80">{tx.hash.slice(0, 16)}...</span>
              <span className={tx.successful ? 'text-xs text-emerald-400 font-semibold' : 'text-xs text-destructive font-semibold'}>
                {tx.successful ? 'success' : 'failed'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground/60">
              <span>Ledger {tx.ledger}</span>
              <span>{new Date(tx.created_at).toLocaleString()}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function VaultDashboard({ capsules, balances, activities, transactions }: Props) {
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
  const targetTotal = capsules.reduce((sum, c) => sum + parseFloat(c.targetAmount || c.amount || '0'), 0);
  const unlocked = capsules.filter(isCapsuleUnlocked).length;
  const locked = capsules.length - unlocked;
  const avgProgress = capsules.length > 0
    ? capsules.reduce((sum, capsule) => sum + capsuleProgress(capsule), 0) / capsules.length
    : 0;

  const achievements: Achievement[] = [
    {
      id: 'first-capsule',
      label: 'First Capsule',
      description: 'Create your first savings capsule on Stellar',
      unlocked: capsules.length >= 1,
    },
    {
      id: 'collaborative',
      label: 'Shared Vault',
      description: 'Add collaborators to a capsule',
      unlocked: capsules.some((capsule) => capsule.collaborators.length > 0),
    },
    {
      id: 'multi-asset',
      label: 'Multi-Asset Saver',
      description: 'Use more than one Stellar asset',
      unlocked: new Set(capsules.map(getCapsuleAsset)).size > 1,
    },
    {
      id: 'goal-builder',
      label: 'Goal Builder',
      description: 'Reach 50% average progress',
      unlocked: avgProgress >= 50,
    },
  ];

  return (
    <div ref={gridRef} className="space-y-6">
      <div className="flex items-center gap-2">
        <Info weight="bold" className="size-4 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground/60">Your savings dashboard — all stats update in real-time from the Stellar blockchain.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <StatCard
            icon={<CoinVertical weight="bold" className="size-5 text-emerald-400" />}
            label="Total Locked"
            value={totalLocked}
            gradient="ring-emerald-500/20 bg-emerald-500/5"
            decimals={2}
            hint="Assets locked in capsules"
          />
        </div>
        <div className="stat-card">
          <StatCard
            icon={<LockSimple weight="bold" className="size-5 text-blue-400" />}
            label="Active Capsules"
            value={locked}
            gradient="ring-blue-500/20 bg-blue-500/5"
            decimals={0}
            hint="Capsules still locked"
          />
        </div>
        <div className="stat-card">
          <StatCard
            icon={<Clock weight="bold" className="size-5 text-amber-400" />}
            label="Unlocked"
            value={unlocked}
            gradient="ring-amber-500/20 bg-amber-500/5"
            decimals={0}
            hint="Ready to claim"
          />
        </div>
        <div className="stat-card">
          <StatCard
            icon={<TrendUp weight="bold" className="size-5 text-purple-400" />}
            label="Goal Coverage"
            value={targetTotal > 0 ? (totalLocked / targetTotal) * 100 : 0}
            suffix="%"
            gradient="ring-purple-500/20 bg-purple-500/5"
            decimals={0}
            hint="Average progress"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PortfolioPanel balances={balances} capsules={capsules} />
        {capsules.length > 1 && <NextUnlockCard capsules={capsules} />}
      </div>

      <AchievementPanel achievements={achievements} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ActivityFeed activities={activities} />
        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  );
}
