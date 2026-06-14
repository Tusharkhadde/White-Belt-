import { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
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
      y: 30,
      opacity: 0,
      duration: 0.6,
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

      gsap.from(cardRef.current, {
        scale: 0.98,
        duration: 0.3,
        ease: 'power2.out',
      });

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
    <Card ref={cardRef} className="bg-card/50 backdrop-blur border-primary/10 card-hover">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          Create Time Capsule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">Recipient Address</label>
            <Input
              placeholder="G..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              disabled={loading}
              className="bg-background/50 transition-all duration-200 focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
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
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Unlock Date</label>
              <Input
                type="datetime-local"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                min={minDate}
                required
                disabled={loading}
                className="bg-background/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">
              Secret Message
              <span className="font-normal text-[10px] ml-1">(optional, max 28 chars, stored in memo)</span>
            </label>
            <Input
              placeholder="Your message to the future..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={28}
              disabled={loading}
              className="bg-background/50"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2 h-11 text-base">
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Sealing Capsule...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Seal Time Capsule
              </>
            )}
          </Button>
        </form>

{error && (
  <div role="alert" className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

{result?.success && (
  <div role="status" className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-2 animate-in">
            <p className="text-green-400 font-medium flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
