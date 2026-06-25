import { useState } from 'react';
import { Fingerprint, Key, ShieldCheck, Spinner } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getErrorMessage, WALLET_STORAGE_KEY } from '@/types';

interface Props {
  onConnect: (publicKey: string) => void;
}

export default function PasskeyLogin({ onConnect }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setError('');
    try {
      if (!window.PublicKeyCredential) {
        throw new Error('Passkeys are not supported in this browser');
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error('No platform authenticator (fingerprint/face ID) available');
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'FutureVault', id: window.location.hostname },
          user: {
            id: userId,
            name: `futurevault-user-${Date.now()}`,
            displayName: 'FutureVault User',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      });

      if (!credential) {
        throw new Error('Passkey creation was cancelled');
      }

      const credentialId = new Uint8Array(credential.rawId);
      let binary = '';
      credentialId.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      const encoded = btoa(binary);

      const deterministicKey = `G${encoded.slice(0, 55).replace(/[^A-Za-z0-9]/g, '').slice(0, 55).padEnd(55, 'A')}`;

      localStorage.setItem(WALLET_STORAGE_KEY, deterministicKey);
      onConnect(deterministicKey);
      toast.success('Signed in with Passkey', {
        description: 'Biometric authentication verified',
      });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      if (msg.includes('cancelled') || msg.includes('not supported')) {
        setError(msg);
      } else {
        setError(msg || 'Passkey authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground/50 tracking-widest font-medium">or</span>
        </div>
      </div>

      <Button
        onClick={handlePasskeyLogin}
        disabled={loading}
        variant="outline"
        className="w-full gap-3 h-12 text-base font-semibold border-primary/20 hover:bg-primary/5 hover:border-primary/30"
      >
        {loading ? (
          <>
            <Spinner weight="bold" className="size-5 animate-spin" />
            Verifying biometric...
          </>
        ) : (
          <>
            <Fingerprint weight="bold" className="size-5 text-primary" />
            Sign in with Passkey
          </>
        )}
      </Button>

      {error && <p className="text-destructive text-sm text-center">{error}</p>}

      <div className="flex items-center justify-center gap-5 text-sm text-muted-foreground/40">
        <span className="flex items-center gap-1.5">
          <ShieldCheck weight="bold" className="size-4" />
          Biometric
        </span>
        <span className="flex items-center gap-1.5">
          <Key weight="bold" className="size-4" />
          Device-only
        </span>
      </div>
    </div>
  );
}
