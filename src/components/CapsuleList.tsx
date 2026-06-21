import { useRef, useCallback, type MouseEvent } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useState } from 'react';
import { ArrowUpRight, LockSimple, LockSimpleOpen } from '@phosphor-icons/react';

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
      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
        <LockSimpleOpen weight="bold" className="size-3.5" />
        Unlocked
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 items-baseline">
        {[
          { val: days, label: 'd' },
          { val: hours, label: 'h' },
          { val: minutes, label: 'm' },
          { val: seconds, label: 's' },
        ].map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-1">
            <div className="text-center">
              <div className="text-lg font-semibold font-mono tabular-nums tracking-tight">
                {String(unit.val).padStart(2, '0')}
              </div>
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">{unit.label}</div>
            </div>
            {i < 3 && <span className="text-xs text-muted-foreground/30 mb-2">:</span>}
          </div>
        ))}
      </div>
      <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function CapsuleCard({ capsule, index }: { capsule: Capsule; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
    card.style.setProperty('--spotlight-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--spotlight-y', `${(y / rect.height) * 100}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
  }, []);

  return (
    <div
      ref={cardRef}
      className="capsule-item rounded-xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-5 space-y-4 transition-all duration-200 ease-out will-change-transform relative overflow-hidden group"
      style={{ transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(16,185,129,0.08), transparent 40%)`,
        }}
      />
      <div className="flex items-start justify-between gap-3 relative" style={{ transform: 'translateZ(20px)' }}>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center ring-1 ring-primary/10">
            <LockSimple weight="bold" className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground/60">To</p>
            <p className="text-sm font-mono tracking-tight">{capsule.recipient.slice(0, 6)}...{capsule.recipient.slice(-4)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground/60">Amount</p>
          <p className="text-sm font-semibold tabular-nums tracking-tight">{capsule.amount} XLM</p>
        </div>
      </div>

      <div className="relative" style={{ transform: 'translateZ(20px)' }}>
        <Countdown unlockDate={capsule.unlockDate} createdAt={capsule.createdAt} />
      </div>

      {capsule.message && (
        <div className="text-xs text-muted-foreground/70 italic leading-relaxed border-t border-border/30 pt-3 relative" style={{ transform: 'translateZ(20px)' }}>
          &ldquo;{capsule.message}&rdquo;
        </div>
      )}

      <div className="border-t border-border/30 pt-3 flex items-center justify-between relative" style={{ transform: 'translateZ(20px)' }}>
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${capsule.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors font-mono inline-flex items-center gap-1"
        >
          {capsule.hash.slice(0, 12)}...
          <ArrowUpRight weight="bold" className="size-3" />
        </a>
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
        y: 24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power3.out',
      });
    }
  }, { dependencies: [capsules.length], scope: listRef });

  if (capsules.length === 0) return null;

  return (
    <div ref={listRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {capsules.map((c, i) => (
        <CapsuleCard key={c.id} capsule={c} index={i} />
      ))}
    </div>
  );
}
