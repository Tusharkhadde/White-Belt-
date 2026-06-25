const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function capsuleKey(seed: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(seed));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptCapsuleMessage(message: string, seed: string): Promise<string> {
  if (!message.trim()) return '';
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await capsuleKey(seed);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(message))
  );
  return `${bytesToBase64(iv)}.${bytesToBase64(encrypted)}`;
}

export async function decryptCapsuleMessage(payload: string, seed: string): Promise<string> {
  if (!payload) return '';
  const [ivValue, encryptedValue] = payload.split('.');
  if (!ivValue || !encryptedValue) return '';
  const key = await capsuleKey(seed);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(ivValue)) },
    key,
    toArrayBuffer(base64ToBytes(encryptedValue))
  );
  return decoder.decode(decrypted);
}

export function buildCapsuleSeed(publicKey: string, unlockDate: string, goal: string): string {
  return `${publicKey}:${unlockDate}:${goal}`;
}
