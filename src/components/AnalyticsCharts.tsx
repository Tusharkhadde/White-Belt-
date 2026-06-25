import { useRef, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ChartLineUp, TrendUp, TrendDown, Minus, Info } from '@phosphor-icons/react';
import type { Capsule, AssetBalance } from '@/types';
import { getCapsuleAsset, capsuleProgress } from '@/types';

interface Props {
  capsules: Capsule[];
  balances: AssetBalance[];
}

function MiniBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full relative" style={{ height: '70px' }}>
            <div
              className={`absolute bottom-0 w-full rounded-t-sm ${item.color} transition-all duration-700 ease-out`}
              style={{ height: `${(item.value / max) * 100}%`, minHeight: item.value > 0 ? '6px' : '0' }}
            />
          </div>
          <span className="text-xs text-muted-foreground/50 truncate w-full text-center">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutRing({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative size-24">
      <svg className="size-24 -rotate-90" viewBox="0 0 90 90">
        {segments.map((seg) => {
          const pct = (seg.value / total) * circumference;
          const dash = `${pct} ${circumference - pct}`;
          const currentOffset = offset;
          offset += pct;
          return (
            <circle
              key={seg.label}
              cx="45"
              cy="45"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              className={seg.color}
              strokeDasharray={dash}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold tabular-nums">{total}</span>
      </div>
    </div>
  );
}

export default function AnalyticsCharts({ capsules, balances }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const assetData = useMemo(() => {
    const byAsset: Record<string, number> = {};
    capsules.forEach((c) => {
      const asset = getCapsuleAsset(c);
      byAsset[asset] = (byAsset[asset] || 0) + parseFloat(c.amount || '0');
    });
    return Object.entries(byAsset)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [capsules]);

  const progressData = useMemo(() => {
    const buckets = [
      { label: '0-25%', min: 0, max: 25, count: 0, color: 'bg-rose-400/60' },
      { label: '25-50%', min: 25, max: 50, count: 0, color: 'bg-amber-400/60' },
      { label: '50-75%', min: 50, max: 75, count: 0, color: 'bg-blue-400/60' },
      { label: '75-100%', min: 75, max: 100, count: 0, color: 'bg-emerald-400/60' },
    ];
    capsules.forEach((c) => {
      const p = capsuleProgress(c);
      const bucket = buckets.find((b) => p >= b.min && p < b.max) || buckets[3];
      bucket.count++;
    });
    return buckets.map((b) => ({ label: b.label, value: b.count, color: b.color }));
  }, [capsules]);

  const donutSegments = useMemo(() => {
    return assetData.map((d, i) => {
      const colors = ['text-primary', 'text-blue-400', 'text-violet-400', 'text-amber-400', 'text-cyan-400'];
      return { label: d.label, value: d.value, color: colors[i % colors.length] };
    });
  }, [assetData]);

  const balanceByAsset = useMemo(() => {
    const byAsset: Record<string, number> = {};
    balances.forEach((b) => {
      const code = b.asset_code || 'XLM';
      byAsset[code] = (byAsset[code] || 0) + parseFloat(b.balance || '0');
    });
    return byAsset;
  }, [balances]);

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
    <div ref={ref} className="rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-semibold tracking-wide">
          <ChartLineUp weight="bold" className="size-4" />
          Analytics
        </div>
        <p className="text-xs text-muted-foreground/50">Visual breakdown of your savings portfolio and progress.</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Locked by asset</p>
          {assetData.length > 0 ? (
            <div className="flex items-center gap-5">
              <DonutRing segments={donutSegments} />
              <div className="space-y-2.5 flex-1">
                {assetData.map((d, i) => {
                  const colors = ['bg-primary', 'bg-blue-400', 'bg-violet-400', 'bg-amber-400'];
                  return (
                    <div key={d.label} className="flex items-center gap-2.5 text-sm">
                      <span className={`size-2.5 rounded-full ${colors[i % colors.length]}`} />
                      <span className="text-muted-foreground/70">{d.label}</span>
                      <span className="ml-auto tabular-nums font-semibold">{d.value.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/40">No locked assets</p>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Progress distribution</p>
          <MiniBarChart data={progressData} />
        </div>
      </div>

      <div className="border-t border-border/30 pt-5 space-y-4">
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Wallet balances</p>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(balanceByAsset).map(([asset, amount]) => (
            <div key={asset} className="rounded-xl bg-background/30 p-3.5 text-center">
              <p className="text-xl font-bold tabular-nums tracking-tight">
                {amount.toFixed(asset === 'XLM' ? 4 : 2)}
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">{asset}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/30 pt-5 flex items-center gap-5">
        <div className="flex items-center gap-1.5 text-sm">
          <TrendUp weight="bold" className="size-4 text-emerald-400" />
          <span className="text-muted-foreground/50">{capsules.length} total capsules</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <TrendDown weight="bold" className="size-4 text-amber-400" />
          <span className="text-muted-foreground/50">
            {capsules.filter((c) => capsuleProgress(c) < 50).length} below 50%
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Minus weight="bold" className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground/50">
            {capsules.filter((c) => capsuleProgress(c) >= 100).length} completed
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <Info weight="bold" className="size-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          All data is fetched in real-time from the Stellar blockchain. Progress is calculated from your on-chain transactions.
        </p>
      </div>
    </div>
  );
}
