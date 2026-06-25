import { useRef, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { UsersThree, Plus, Crown, User, Info } from '@phosphor-icons/react';
import type { Capsule } from '@/types';

interface Props {
  capsules: Capsule[];
  publicKey: string;
}

function generateColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30',
    'bg-blue-500/20 text-blue-400 ring-blue-500/30',
    'bg-violet-500/20 text-violet-400 ring-violet-500/30',
    'bg-amber-500/20 text-amber-400 ring-amber-500/30',
    'bg-rose-500/20 text-rose-400 ring-rose-500/30',
    'bg-cyan-500/20 text-cyan-400 ring-cyan-500/30',
  ];
  return colors[Math.abs(hash) % colors.length];
}

export default function CollaborativeVault({ capsules, publicKey }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const collabData = useMemo(() => {
    const collabCapsules = capsules.filter((c) => c.collaborators.length > 0);
    const totalCollabs = collabCapsules.reduce((sum, c) => sum + c.collaborators.length, 0);
    return { collabCapsules, totalCollabs };
  }, [capsules]);

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

  if (collabData.collabCapsules.length === 0) {
    return (
      <div ref={ref} className="rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-semibold tracking-wide">
          <UsersThree weight="bold" className="size-4" />
          Collaborative Vaults
        </div>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="size-14 rounded-2xl bg-cyan-500/5 flex items-center justify-center ring-1 ring-cyan-500/10 mb-4">
            <UsersThree weight="light" className="size-6 text-cyan-400/50" />
          </div>
          <p className="text-base text-muted-foreground/70 mb-1">No collaborative vaults yet</p>
          <p className="text-sm text-muted-foreground/40 max-w-[240px]">
            Add comma-separated public keys when creating a capsule to invite contributors
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] p-6 space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-semibold tracking-wide">
            <UsersThree weight="bold" className="size-4" />
            Collaborative Vaults
          </div>
          <span className="text-xs text-muted-foreground/50">
            {collabData.totalCollabs} contributor{collabData.totalCollabs !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-xs text-muted-foreground/50">
          Capsules with multiple contributors. Everyone can fund and track progress.
        </p>
      </div>

      <div className="space-y-4">
        {collabData.collabCapsules.map((capsule) => (
          <div
            key={capsule.id}
            className="rounded-xl border border-border/30 bg-background/20 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-bold truncate">{capsule.title}</p>
              <div className="flex items-center gap-1">
                <span className="size-6 rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
                  <Crown weight="bold" className="size-3 text-primary" />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div
                  className={`size-8 rounded-full flex items-center justify-center ring-2 ring-background text-xs font-bold ${generateColor(publicKey)}`}
                >
                  <User weight="bold" className="size-4" />
                </div>
                {capsule.collaborators.slice(0, 3).map((collab) => (
                  <div
                    key={collab}
                    className={`size-8 rounded-full flex items-center justify-center ring-2 ring-background text-xs font-bold ${generateColor(collab)}`}
                  >
                    {collab.slice(4, 6).toUpperCase()}
                  </div>
                ))}
                {capsule.collaborators.length > 3 && (
                  <div className="size-8 rounded-full bg-muted flex items-center justify-center ring-2 ring-background text-xs font-medium text-muted-foreground">
                    +{capsule.collaborators.length - 3}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground/50 ml-1">
                {capsule.collaborators.length + 1} members
              </span>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
              <Plus weight="bold" className="size-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground/60">Contributors can fund this capsule on-chain. Anyone with the public key can contribute.</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <Info weight="bold" className="size-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          Collaborative vaults let multiple people contribute to a shared savings goal. Add collaborators by their Stellar public keys.
        </p>
      </div>
    </div>
  );
}
