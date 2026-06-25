import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  Coins,
  Lightning,
  ArrowsLeftRight,
  UsersThree,
  Brain,
  ChartLineUp,
  Fingerprint,
  Rocket,
} from '@phosphor-icons/react';

const features = [
  {
    icon: <Coins weight="duotone" className="size-7" />,
    title: 'Claimable Balances',
    description: 'Lock your assets on Stellar with time-based rules. When the time comes, you can claim them — like a digital time capsule.',
    tip: 'Your funds stay safe on-chain until the unlock date',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/20',
    gradient: 'from-emerald-500/20 to-emerald-500/0',
  },
  {
    icon: <Lightning weight="duotone" className="size-7" />,
    title: 'Soroban Smart Contracts',
    description: 'Vault rules are enforced by Soroban smart contracts on Stellar — transparent, verifiable, and unstoppable.',
    tip: 'Smart contracts ensure your rules are always followed',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    ring: 'ring-violet-500/20',
    gradient: 'from-violet-500/20 to-violet-500/0',
  },
  {
    icon: <ArrowsLeftRight weight="duotone" className="size-7" />,
    title: 'Multi-Asset Capsules',
    description: 'Save in XLM, USDC, or any custom Stellar token. Mix and match assets in your savings goals.',
    tip: 'Choose from your wallet or add any custom asset',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/20',
    gradient: 'from-blue-500/20 to-blue-500/0',
  },
  {
    icon: <UsersThree weight="duotone" className="size-7" />,
    title: 'Collaborative Vaults',
    description: 'Invite friends or family to contribute to a shared savings goal. Everyone can see progress together.',
    tip: 'Add contributors by their Stellar public key',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    ring: 'ring-cyan-500/20',
    gradient: 'from-cyan-500/20 to-cyan-500/0',
  },
  {
    icon: <Brain weight="duotone" className="size-7" />,
    title: 'AI Future Letter',
    description: 'A personalized letter generated for your future self. It unlocks when your capsule opens — a message in a bottle.',
    tip: 'Written by AI based on your goal and savings plan',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/20',
    gradient: 'from-amber-500/20 to-amber-500/0',
  },
  {
    icon: <ChartLineUp weight="duotone" className="size-7" />,
    title: 'Analytics Dashboard',
    description: 'Track your portfolio, see progress toward goals, and view all on-chain activity in one place.',
    tip: 'Real-time stats from the Stellar blockchain',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    ring: 'ring-rose-500/20',
    gradient: 'from-rose-500/20 to-rose-500/0',
  },
  {
    icon: <Fingerprint weight="duotone" className="size-7" />,
    title: 'Passkey Login',
    description: 'Sign in with your fingerprint or face ID — no seed phrases to remember. Your device is your key.',
    tip: 'Uses your device\'s built-in biometric security',
    color: 'text-primary',
    bg: 'bg-primary/10',
    ring: 'ring-primary/20',
    gradient: 'from-primary/20 to-primary/0',
  },
];

export default function FeatureHighlights() {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const cards = gridRef.current?.querySelectorAll('.feature-card');
    if (cards) {
      gsap.from(cards, {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power3.out',
      });
    }
  }, { scope: gridRef });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Rocket weight="bold" className="size-4 text-primary" />
          <span className="text-sm font-medium text-primary">Built on Stellar</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          Everything you need for{' '}
          <span className="text-primary">smart savings</span>
        </h2>
        <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          FutureVault combines Stellar blockchain, smart contracts, and AI to help you save smarter.
          Here's what makes it powerful:
        </p>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="feature-card group relative rounded-2xl bg-card/30 backdrop-blur-xl ring-1 ring-white/[0.06] p-6 space-y-4 transition-all duration-300 hover:ring-white/[0.12] hover:bg-card/50 overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative flex items-start gap-4">
              <div className={`size-14 rounded-2xl ${feature.bg} flex items-center justify-center ring-1 ${feature.ring} shrink-0`}>
                <span className={feature.color}>{feature.icon}</span>
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <p className="text-lg font-bold tracking-tight">{feature.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                <p className="text-xs text-primary/60 font-medium flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-primary/40" />
                  {feature.tip}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
