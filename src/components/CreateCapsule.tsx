import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendXlm } from '@/utils/stellar';
import type { Capsule } from './CapsuleList';

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

  const minDate = new Date(Date.now() + 60000).toISOString().slice(0, 16);

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
      setRecipient('');
      setAmount('');
      setMessage('');
      setUnlockDate('');
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setResult({ hash: '', success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/10">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          Create Time Capsule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Recipient Address</label>
            <Input
              placeholder="G..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              disabled={loading}
              className="bg-background/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Amount (XLM)</label>
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
              <label className="text-xs text-muted-foreground">Unlock Date</label>
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
            <label className="text-xs text-muted-foreground">Secret Message <span className="text-[10px]">(optional, stored in memo)</span></label>
            <Input
              placeholder="Your message to the future..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={28}
              disabled={loading}
              className="bg-background/50"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2">
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Sealing Capsule...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Seal Time Capsule
              </>
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {result?.success && (
          <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm space-y-1">
            <p className="font-medium">Capsule sealed! 🎉</p>
            <p className="text-xs break-all font-mono">Hash: {result.hash}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
