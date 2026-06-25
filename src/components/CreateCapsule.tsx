import { useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  Brain,
  CaretDown,
  CheckCircle,
  Info,
  LockKey,
  PaperPlaneTilt,
  Sparkle,
  UsersThree,
  WarningCircle,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { assertValidPublicKey, normalizeAssetLabel, sendAssetPayment } from '@/utils/stellar';
import { buildCapsuleSeed, encryptCapsuleMessage } from '@/utils/crypto';
import { toast } from 'sonner';
import type { Capsule, AssetBalance } from '@/types';
import { getErrorMessage } from '@/types';

gsap.registerPlugin(useGSAP);

interface Props {
  publicKey: string;
  onCapsuleCreated: (capsule: Capsule) => void;
  onBalanceRefresh: () => void;
  balances: AssetBalance[];
}

type AssetChoice = 'native' | 'wallet' | 'custom';

function generateFutureLetter(goal: string, amount: string, asset: string, unlockDate: string): string {
  const formattedDate = unlockDate
    ? new Date(unlockDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : 'your unlock day';
  const target = goal.trim() || 'the future you planned';

  return [
    `Dear future me,`,
    `Today I protected ${amount || 'this'} ${asset} for ${target}.`,
    `When this opens on ${formattedDate}, remember that progress was built one deliberate transfer at a time.`,
    `Use these funds with the same intention that created this vault.`,
  ].join('\n\n');
}

export default function CreateCapsule({ publicKey, onCapsuleCreated, onBalanceRefresh, balances }: Props) {
  const [title, setTitle] = useState('Emergency runway');
  const [goal, setGoal] = useState('Build a three-month safety net');
  const [recipient, setRecipient] = useState(publicKey);
  const [amount, setAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [secretMessage, setSecretMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ hash: string; success: boolean } | null>(null);
  const [error, setError] = useState('');
  const [assetMode, setAssetMode] = useState<AssetChoice>('native');
  const [walletAssetKey, setWalletAssetKey] = useState('native');
  const [customAssetCode, setCustomAssetCode] = useState('USDC');
  const [customAssetIssuer, setCustomAssetIssuer] = useState('');
  const [collaborators, setCollaborators] = useState('');
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [minDate] = useState(() => new Date(Date.now() + 60000).toISOString().slice(0, 16));
  const cardRef = useRef<HTMLDivElement>(null);

  const availableAssets = balances.filter((b) => parseFloat(b.balance) > 0);
  const walletAssets = availableAssets.filter((b) => b.asset_type !== 'native');

  const selectedAssetData = useMemo(() => {
    if (assetMode === 'custom') {
      return {
        code: normalizeAssetLabel(customAssetCode),
        issuer: customAssetIssuer.trim(),
        balance: undefined,
      };
    }

    if (walletAssetKey === 'native') {
      return {
        code: undefined,
        issuer: undefined,
        balance: balances.find((b) => b.asset_type === 'native')?.balance,
      };
    }

    const found = walletAssets.find(
      (b) => `${b.asset_code}:${b.asset_issuer}` === walletAssetKey
    );
    return found
      ? { code: found.asset_code, issuer: found.asset_issuer, balance: found.balance }
      : { code: undefined, issuer: undefined, balance: undefined };
  }, [assetMode, balances, customAssetCode, customAssetIssuer, walletAssetKey, walletAssets]);

  const assetLabel = selectedAssetData.code || 'XLM';
  const aiLetter = useMemo(
    () => generateFutureLetter(goal, amount, assetLabel, unlockDate),
    [amount, assetLabel, goal, unlockDate]
  );

  useGSAP(() => {
    gsap.from(cardRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    });
  }, { scope: cardRef });

  const collaboratorList = collaborators
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      assertValidPublicKey(recipient, 'Recipient');
      collaboratorList.forEach((collaborator, index) => {
        assertValidPublicKey(collaborator, `Collaborator ${index + 1}`);
      });

      const assetCode = selectedAssetData.code;
      const assetIssuer = selectedAssetData.issuer;
      const memo = `FV:${title}`.slice(0, 28);
      const encryptedMessage = await encryptCapsuleMessage(
        secretMessage,
        buildCapsuleSeed(publicKey, new Date(unlockDate).toISOString(), goal)
      );
      const res = await sendAssetPayment(publicKey, recipient, amount, memo, assetCode, assetIssuer);
      setResult(res);
      onBalanceRefresh();

      const capsule: Capsule = {
        id: `cap-${Date.now()}`,
        title: title.trim() || 'Untitled vault',
        goal: goal.trim() || 'Future savings goal',
        recipient,
        amount,
        targetAmount: targetAmount || amount,
        message: '',
        encryptedMessage,
        futureLetter: aiLetter,
        collaborators: collaboratorList,
        asset_code: assetCode,
        asset_issuer: assetIssuer,
        unlockDate: new Date(unlockDate).toISOString(),
        hash: res.hash,
        createdAt: Date.now(),
      };
      onCapsuleCreated(capsule);

      toast.success('FutureVault capsule sealed', {
        description: `${amount} ${assetLabel} committed until ${new Date(unlockDate).toLocaleDateString()}`,
      });

      setTitle('Emergency runway');
      setGoal('Build a three-month safety net');
      setRecipient(publicKey);
      setAmount('');
      setTargetAmount('');
      setSecretMessage('');
      setUnlockDate('');
      setCollaborators('');
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(message);
      setResult({ hash: '', success: false });
      toast.error('Transaction failed', { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card ref={cardRef} className="backdrop-blur-xl bg-card/60 ring-1 ring-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-3 tracking-tight">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
            <LockKey weight="bold" className="size-5 text-primary" />
          </div>
          Create a Savings Capsule
        </CardTitle>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Lock your assets on Stellar until a future date. Your funds stay safe on-chain until unlock day.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Capsule Name</label>
              <Input
                className="h-11 text-base"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground/60">Give your capsule a memorable name</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Unlock Date</label>
              <Input
                type="datetime-local"
                className="h-11 text-base"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                min={minDate}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground/60">When should this capsule open?</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Goal</label>
            <Input
              className="h-11 text-base"
              placeholder="What are you saving for?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground/60">Describe what this savings goal means to you</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Recipient Address</label>
            <Input
              className="h-11 text-base font-mono"
              placeholder="G... (Stellar public key)"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground/60">Who receives the funds when the capsule unlocks? (Usually your own address)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Initial Deposit</label>
              <Input
                type="number"
                step="0.0000001"
                min="0.0000001"
                className="h-11 text-base"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground/60">How much to lock now</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Goal Target</label>
              <Input
                type="number"
                step="0.0000001"
                min="0.0000001"
                className="h-11 text-base"
                placeholder="Optional"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground/60">Optional target amount</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Asset</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAssetPickerOpen(!assetPickerOpen)}
                  disabled={loading}
                  className="w-full h-11 px-3 rounded-lg bg-background/50 border border-input text-base text-left flex items-center justify-between hover:bg-muted/30 transition-colors disabled:opacity-50"
                >
                  <span className="font-semibold">{assetLabel}</span>
                  <CaretDown weight="bold" className="size-4 text-muted-foreground" />
                </button>
                {assetPickerOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg bg-popover border border-border shadow-lg py-1 max-h-56 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setAssetMode('native');
                        setWalletAssetKey('native');
                        setAssetPickerOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-base hover:bg-muted/50 transition-colors flex items-center justify-between text-primary"
                    >
                      <span className="font-semibold">XLM</span>
                      {balances.find((b) => b.asset_type === 'native') && (
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {parseFloat(balances.find((b) => b.asset_type === 'native')!.balance).toFixed(4)}
                        </span>
                      )}
                    </button>
                    {walletAssets.map((b) => (
                      <button
                        key={`${b.asset_code}:${b.asset_issuer}`}
                        type="button"
                        onClick={() => {
                          setAssetMode('wallet');
                          setWalletAssetKey(`${b.asset_code}:${b.asset_issuer}`);
                          setAssetPickerOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-base hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold">{b.asset_code}</span>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {parseFloat(b.balance).toFixed(2)}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setAssetMode('custom');
                        setAssetPickerOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-base hover:bg-muted/50 transition-colors"
                    >
                      Custom asset...
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {assetMode === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 rounded-xl border border-border/60 bg-background/30 p-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Asset Code</label>
                <Input
                  className="h-11 text-base"
                  value={customAssetCode}
                  onChange={(e) => setCustomAssetCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Issuer Public Key</label>
                <Input
                  className="h-11 text-base font-mono"
                  placeholder="G..."
                  value={customAssetIssuer}
                  onChange={(e) => setCustomAssetIssuer(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {selectedAssetData.balance && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
              <Info weight="bold" className="size-4" />
              Available: <span className="font-semibold text-foreground">{parseFloat(selectedAssetData.balance).toFixed(assetLabel === 'XLM' ? 4 : 2)} {assetLabel}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UsersThree weight="bold" className="size-4" />
              Collaborators
              <span className="font-normal text-xs text-muted-foreground/60">(optional)</span>
            </label>
            <Input
              className="h-11 text-base"
              placeholder="Add collaborators by public key, comma-separated"
              value={collaborators}
              onChange={(e) => setCollaborators(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground/60">
              Other people who can contribute to this capsule. Add their Stellar public keys separated by commas.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Private Message</label>
            <textarea
              className="min-h-24 w-full resize-none rounded-lg border border-input bg-background/50 px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
              placeholder="Write a secret message that unlocks with your capsule..."
              value={secretMessage}
              onChange={(e) => setSecretMessage(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground/60">
              This message is encrypted and only readable when the capsule unlocks. Nobody else can see it.
            </p>
          </div>

          <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <Brain weight="bold" className="size-5" />
                </div>
                <div>
                  <p className="text-base font-bold text-primary">AI-Generated Future Letter</p>
                  <p className="text-xs text-muted-foreground/60">A message from your present self to your future self</p>
                </div>
              </div>
              <span className="text-[10px] text-primary/40 font-mono tracking-wider uppercase">Preview</span>
            </div>
            <div className="relative">
              <div className="absolute -left-2 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-primary/40 to-primary/10" />
              <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed pl-4 italic">{aiLetter}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 pt-1">
              <Sparkle weight="bold" className="size-3 text-primary/40" />
              Auto-generated based on your goal, amount, and unlock date
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-3 h-13 text-base font-bold">
            {loading ? (
              <>
                <div className="size-5 rounded-full border-2 border-background/50 border-t-background animate-spin" />
                Sealing on Stellar...
              </>
            ) : (
              <>
                <PaperPlaneTilt weight="bold" className="size-5" />
                Seal Capsule
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground/50">
            This will create a Stellar transaction. You'll need to approve it in your wallet.
          </p>
        </form>

        {error && (
          <div role="alert" className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
            <WarningCircle weight="bold" className="size-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Transaction failed</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        {result?.success && (
          <div role="status" className="mt-4 p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
            <p className="text-emerald-400 font-bold flex items-center gap-2 text-base">
              <CheckCircle weight="bold" className="size-5" />
              Capsule sealed successfully!
            </p>
            <p className="text-sm text-muted-foreground break-all font-mono">Hash: {result.hash}</p>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View on Stellar Expert
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
