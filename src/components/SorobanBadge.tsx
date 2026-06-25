import { Lightning, ShieldCheck, Code, Info } from '@phosphor-icons/react';

export default function SorobanBadge() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10">
        <div className="size-12 rounded-xl bg-violet-500/10 flex items-center justify-center ring-1 ring-violet-500/20 shrink-0">
          <Lightning weight="bold" className="size-6 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-violet-400">Soroban Smart Contract</p>
            <ShieldCheck weight="bold" className="size-4 text-emerald-400" />
          </div>
          <p className="text-sm text-muted-foreground/60 leading-relaxed mt-0.5">
            Vault logic enforced on-chain via Soroban. Your rules are transparent and verifiable on Stellar.
          </p>
        </div>
        <a
          href="https://soroban.stellar.org"
          target="_blank"
          rel="noopener noreferrer"
          className="size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 transition-colors shrink-0"
          aria-label="View Soroban docs"
        >
          <Code weight="bold" className="size-4" />
        </a>
      </div>
      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <Info weight="bold" className="size-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          Soroban is Stellar's smart contract platform. It enables transparent, verifiable rules for your savings capsules — like time-locks and claimable balances.
        </p>
      </div>
    </div>
  );
}
