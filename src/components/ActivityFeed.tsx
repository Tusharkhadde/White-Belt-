import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Clock, CheckCircle, PlugsConnected, CoinVertical } from '@phosphor-icons/react';
import type { Activity } from '@/types';

gsap.registerPlugin(useGSAP);

interface Props {
  activities: Activity[];
}

const activityConfig: Record<Activity['type'], { icon: React.ReactNode; gradient: string }> = {
  capsule_sealed: {
    icon: <CheckCircle weight="bold" className="size-3.5 text-emerald-400" />,
    gradient: 'ring-emerald-500/20 bg-emerald-500/5',
  },
  capsule_unlocked: {
    icon: <Clock weight="bold" className="size-3.5 text-amber-400" />,
    gradient: 'ring-amber-500/20 bg-amber-500/5',
  },
  wallet_connected: {
    icon: <PlugsConnected weight="bold" className="size-3.5 text-blue-400" />,
    gradient: 'ring-blue-500/20 bg-blue-500/5',
  },
  funded: {
    icon: <CoinVertical weight="bold" className="size-3.5 text-purple-400" />,
    gradient: 'ring-purple-500/20 bg-purple-500/5',
  },
};

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ActivityItem({ activity }: { activity: Activity }) {
  const config = activityConfig[activity.type];

  return (
    <div className="flex items-start gap-3 activity-item">
      <div className={`size-7 rounded-lg flex items-center justify-center ring-1 shrink-0 mt-0.5 ${config.gradient}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground/80 leading-relaxed">{activity.description}</p>
        {activity.amount && (
          <p className="text-[11px] text-muted-foreground/60 mt-0.5 tabular-nums">
            {activity.amount} {activity.asset || 'XLM'}
          </p>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground/40 shrink-0 pt-0.5">{timeAgo(activity.timestamp)}</span>
    </div>
  );
}

export default function ActivityFeed({ activities }: Props) {
  const feedRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const items = feedRef.current?.querySelectorAll('.activity-item');
    if (items) {
      gsap.from(items, {
        x: -12,
        opacity: 0,
        duration: 0.4,
        stagger: 0.04,
        ease: 'power2.out',
      });
    }
  }, { dependencies: [activities.length], scope: feedRef });

  if (activities.length === 0) return null;

  return (
    <div ref={feedRef} className="rounded-xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-5 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
        <Clock weight="bold" className="size-3.5" />
        Recent Activity
      </div>
      <div className="space-y-3">
        {activities.slice(0, 10).map((a) => (
          <ActivityItem key={a.id} activity={a} />
        ))}
      </div>
    </div>
  );
}
