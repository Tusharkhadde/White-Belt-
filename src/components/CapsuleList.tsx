import { useRef, useCallback, type MouseEvent } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  EnvelopeSimple,
  Info,
  LockSimple,
  LockSimpleOpen,
  UsersThree,
} from '@phosphor-icons/react';
import type { Capsule } from '@/types';
import { capsuleProgress, getCapsuleAsset, isCapsuleUnlocked } from '@/types';
import { buildCapsuleSeed, decryptCapsuleMessage } from '@/utils/crypto';

gsap.registerPlugin(useGSAP);

interface Props {
  capsules: Capsule[];
  publicKey: string;
}

function Countdown({ unlockDate, createdAt }: { unlockDate: string; createdAt: number }) {
  const [now, setNow] = useState(() => Date.now());

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
      <div className="flex items-center gap-2 text-emerald-400 text-base font-bold">
        <LockSimpleOpen weight="bold" className="size-5" />
        Unlocked
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-baseline">
        {[
          { val: days, label: 'days' },
          { val: hours, label: 'hrs' },
          { val: minutes, label: 'min' },
          { val: seconds, label: 'sec' },
        ].map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-1.5">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono tabular-nums tracking-tight">
                {String(unit.val).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">{unit.label}</div>
            </div>
            {i < 3 && <span className="text-lg text-muted-foreground/30 mb-2">:</span>}
          </div>
        ))}
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function SecretMessage({ capsule, publicKey }: { capsule: Capsule; publicKey: string }) {
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const unlocked = isCapsuleUnlocked(capsule);

  useEffect(() => {
    let active = true;
    if (!unlocked || !capsule.encryptedMessage) {
      return;
    }

    decryptCapsuleMessage(
      capsule.encryptedMessage,
      buildCapsuleSeed(publicKey, capsule.unlockDate, capsule.goal)
    )
      .then((decrypted) => {
        if (active) setMessage(decrypted);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [capsule.encryptedMessage, capsule.goal, capsule.unlockDate, publicKey, unlocked]);

  if (!capsule.encryptedMessage) return null;

  return (
    <div className="text-sm leading-relaxed border-t border-border/30 pt-4 relative" style={{ transform: 'translateZ(20px)' }}>
      <div className="flex items-center gap-2 text-muted-foreground/70 mb-2">
        <EnvelopeSimple weight="bold" className="size-4" />
        <span className="font-semibold">Private Message</span>
      </div>
      {!unlocked && (
        <div className="flex items-center gap-2 text-muted-foreground/50 italic">
          <Info weight="bold" className="size-3" />
          Encrypted until unlock day
        </div>
      )}
      {unlocked && message && <p className="text-foreground/80 italic text-base leading-relaxed">&ldquo;{message}&rdquo;</p>}
      {unlocked && failed && <p className="text-destructive/80">Unable to decrypt this message in this wallet context.</p>}
    </div>
  );
}

function CapsuleCard({ capsule, publicKey }: { capsule: Capsule; publicKey: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const assetLabel = getCapsuleAsset(capsule);
  const progress = capsuleProgress(capsule);

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
      className="capsule-item rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] p-6 space-y-5 transition-all duration-200 ease-out will-change-transform relative overflow-hidden group"
      style={{ transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(16,185,129,0.08), transparent 40%)`,
        }}
      />
      <div className="flex items-start justify-between gap-4 relative" style={{ transform: 'translateZ(20px)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center ring-1 ring-primary/10 shrink-0">
            <LockSimple weight="bold" className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-wider font-medium">Goal</p>
            <p className="text-lg font-bold tracking-tight truncate">{capsule.title}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider font-medium">Saved</p>
          <p className="text-lg font-bold tabular-nums tracking-tight">{capsule.amount} {assetLabel}</p>
        </div>
      </div>

      <div className="space-y-3 relative" style={{ transform: 'translateZ(20px)' }}>
        <p className="text-sm text-muted-foreground/70 leading-relaxed">{capsule.goal}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground/60">
          <span className="font-medium">Progress</span>
          <span className="tabular-nums">{Math.round(progress)}% of {capsule.targetAmount} {assetLabel}</span>
        </div>
        <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="relative" style={{ transform: 'translateZ(20px)' }}>
        <Countdown unlockDate={capsule.unlockDate} createdAt={capsule.createdAt} />
      </div>

      {capsule.collaborators.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground/60 relative" style={{ transform: 'translateZ(20px)' }}>
          <UsersThree weight="bold" className="size-4" />
          {capsule.collaborators.length} collaborator{capsule.collaborators.length !== 1 ? 's' : ''} contributing
        </div>
      )}

      <SecretMessage capsule={capsule} publicKey={publicKey} />

      {isCapsuleUnlocked(capsule) && (
        <div className="text-sm text-muted-foreground/70 leading-relaxed border-t border-border/30 pt-4 whitespace-pre-line relative" style={{ transform: 'translateZ(20px)' }}>
          {capsule.futureLetter}
        </div>
      )}

      <div className="border-t border-border/30 pt-4 flex items-center justify-between relative" style={{ transform: 'translateZ(20px)' }}>
        <p className="text-sm text-muted-foreground/50 font-mono">
          To {capsule.recipient.slice(0, 6)}...{capsule.recipient.slice(-4)}
        </p>
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${capsule.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono inline-flex items-center gap-1.5"
        >
          {capsule.hash.slice(0, 12)}...
          <ArrowUpRight weight="bold" className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function CapsuleList({ capsules, publicKey }: Props) {
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
    <div ref={listRef} className="space-y-4">
      <h3 className="text-lg font-bold tracking-tight">Your Capsules</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {capsules.map((c) => (
          <CapsuleCard key={c.id} capsule={c} publicKey={publicKey} />
        ))}
      </div>
    </div>
  );
}
