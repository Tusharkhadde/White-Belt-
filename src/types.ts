export interface AssetBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

export interface Activity {
  id: string;
  type:
    | 'capsule_sealed'
    | 'capsule_unlocked'
    | 'wallet_connected'
    | 'funded'
    | 'contribution'
    | 'milestone';
  description: string;
  amount?: string;
  asset?: string;
  hash?: string;
  timestamp: number;
}

export interface Capsule {
  id: string;
  title: string;
  goal: string;
  recipient: string;
  amount: string;
  targetAmount: string;
  message: string;
  encryptedMessage: string;
  futureLetter: string;
  collaborators: string[];
  asset_code?: string;
  asset_issuer?: string;
  unlockDate: string;
  hash: string;
  createdAt: number;
}

export interface TransactionRecord {
  id: string;
  hash: string;
  created_at: string;
  memo?: string;
  successful: boolean;
  ledger: number;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
}

export const ACTIVITY_STORAGE_KEY = 'stellar-activity';
export const CAPSULE_STORAGE_KEY = 'stellar-capsules';
export const WALLET_STORAGE_KEY = 'stellar-wallet-pk';

export function loadActivities(): Activity[] {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveActivities(activities: Activity[]): void {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activities));
}

export function addActivity(activity: Activity): Activity[] {
  const activities = loadActivities();
  const updated = [activity, ...activities].slice(0, 50);
  saveActivities(updated);
  return updated;
}

export function loadCapsules(): Capsule[] {
  try {
    return JSON.parse(localStorage.getItem(CAPSULE_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}

export function getCapsuleAsset(capsule: Capsule): string {
  return capsule.asset_code || 'XLM';
}

export function capsuleProgress(capsule: Capsule): number {
  const target = parseFloat(capsule.targetAmount || capsule.amount || '0');
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.min(100, (parseFloat(capsule.amount || '0') / target) * 100);
}

export function isCapsuleUnlocked(capsule: Capsule): boolean {
  return new Date(capsule.unlockDate).getTime() <= Date.now();
}
