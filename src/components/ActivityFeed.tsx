import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Clock, CheckCircle, PlugsConnected, CoinVertical, Medal, UsersThree } from '@phosphor-icons/react';
import type { Activity } from '@/types';

gsap.registerPlugin(useGSAP);

interface Props {
  activities: Activity[];
}

const activityConfig: Record<Activity['type'], { icon: React.ReactNode; gradient: string; label: string }> = {
  capsule_sealed: {
    icon: <CheckCircle weight="bold" className="size-4 text-emerald-400" />,
    gradient: 'ring-emerald-500/20 bg-emerald-500/5',
    label: 'Capsule Created',
  },
  capsule_unlocked: {
    icon: <Clock weight="bold" className="size-4 text-amber-400" />,
    gradient: 'ring-amber-500/20 bg-amber-500/5',
    label: 'Capsule Unlocked',
  },
  wallet_connected: {
    icon: <PlugsConnected weight="bold" className="size-4 text-blue-400" />,
    gradient: 'ring-blue-500/20 bg-blue-500/5',
    label: 'Wallet Connected',
  },
  funded: {
    icon: <CoinVertical weight="bold" className="size-4 text-purple-400" />,
    gradient: 'ring-purple-500/20 bg-purple-500/5',
    label: 'Account Funded',
  },
  contribution: {
    icon: <UsersThree weight="bold" className="size-4 text-cyan-400" />,
    gradient: 'ring-cyan-500/20 bg-cyan-500/5',
    label: 'Contribution',
  },
  milestone: {
    icon: <Medal weight="bold" className="size-4 text-amber-400" />,
    gradient: 'ring-amber-500/20 bg-amber-500/5',
    label: 'Milestone',
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
    <div className="flex items-start gap-3.5 activity-item">
      <div className={`size-9 rounded-xl flex items-center justify-center ring-1 shrink-0 mt-0.5 ${config.gradient}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/80 leading-relaxed">{activity.description}</p>
        {activity.amount && (
          <p className="text-xs text-muted-foreground/60 mt-1 tabular-nums font-medium">
            {activity.amount} {activity.asset || 'XLM'}
          </p>
        )}
        {activity.hash && (
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${activity.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary/80 hover:underline font-mono mt-1 inline-block"
          >
            {activity.hash.slice(0, 12)}...
          </a>
        )}
      </div>
      <span className="text-xs text-muted-foreground/40 shrink-0 pt-0.5">{timeAgo(activity.timestamp)}</span>
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
    <div ref={feedRef} className="rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-semibold tracking-wide">
        <Clock weight="bold" className="size-4" />
        Recent Activity
      </div>
      <div className="space-y-4">
        {activities.slice(0, 10).map((a) => (
          <ActivityItem key={a.id} activity={a} />
        ))}
      </div>
    </div>
  );
}
