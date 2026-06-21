import { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { LockKey, PaperPlaneTilt, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendXlm } from '@/utils/stellar';
import { toast } from 'sonner';
import type { Capsule } from './CapsuleList';

gsap.registerPlugin(useGSAP);

interface Props {
  publicKey: string;
  onCapsuleCreated: (capsule: Capsule) => void;
  onBalanceRefresh: () => void;
}

export default function CreateCapsule({ publicKey, onCapsuleCreated, onBalanceRefresh }: Props) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ hash: string; success: boolean } | null>(null);
  const [error, setError] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const minDate = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  useGSAP(() => {
    gsap.from(cardRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    });
  }, { scope: cardRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await sendXlm(publicKey, recipient, amount, message || undefined);
      setResult(res);
      onBalanceRefresh();

      const capsule: Capsule = {
        id: Date.now().toString(),
        recipient,
        amount,
        message,
        unlockDate: new Date(unlockDate).toISOString(),
        hash: res.hash,
        createdAt: Date.now(),
      };
      onCapsuleCreated(capsule);

      toast.success('Capsule sealed!', {
        description: `${amount} XLM locked until ${new Date(unlockDate).toLocaleDateString()}`,
      });

      setRecipient('');
      setAmount('');
      setMessage('');
      setUnlockDate('');
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setResult({ hash: '', success: false });
      toast.error('Transaction failed', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card ref={cardRef} className="backdrop-blur-xl bg-card/50 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 tracking-tight">
          <LockKey weight="bold" className="size-4 text-primary" />
          Create Time Capsule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Recipient Address</label>
            <Input
              placeholder="G..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Amount (XLM)</label>
              <Input
                type="number"
                step="0.0000001"
                min="0.0000001"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Unlock Date</label>
              <Input
                type="datetime-local"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                min={minDate}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">
              Secret Message
              <span className="font-normal text-[10px] ml-1">optional, max 28 chars</span>
            </label>
            <Input
              placeholder="Your message to the future..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={28}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2 h-10">
            {loading ? (
              <>
                <div className="size-4 rounded-full border-2 border-background/50 border-t-background animate-spin" />
                Sealing Capsule...
              </>
            ) : (
              <>
                <PaperPlaneTilt weight="bold" className="size-4" />
                Seal Time Capsule
              </>
            )}
          </Button>
        </form>

        {error && (
          <div role="alert" className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
            <WarningCircle weight="bold" className="size-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result?.success && (
          <div role="status" className="mt-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 space-y-2">
            <p className="text-emerald-400 font-medium flex items-center gap-2 text-sm">
              <CheckCircle weight="bold" className="size-4" />
              Capsule sealed successfully!
            </p>
            <p className="text-xs text-muted-foreground break-all font-mono">Hash: {result.hash}</p>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              View on StellarExpert
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
