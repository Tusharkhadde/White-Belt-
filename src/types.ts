export interface AssetBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

export interface Activity {
  id: string;
  type: 'capsule_sealed' | 'capsule_unlocked' | 'wallet_connected' | 'funded';
  description: string;
  amount?: string;
  asset?: string;
  timestamp: number;
}

export interface Capsule {
  id: string;
  recipient: string;
  amount: string;
  message: string;
  asset_code?: string;
  asset_issuer?: string;
  unlockDate: string;
  hash: string;
  createdAt: number;
}

export const ACTIVITY_STORAGE_KEY = 'stellar-activity';
export const CAPSULE_STORAGE_KEY = 'stellar-capsules';

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

export function formatAssetLabel(assetCode?: string): string {
  return assetCode || 'XLM';
}

export function assetDisplay(balance: string, assetCode?: string): string {
  const code = assetCode || 'XLM';
  return `${parseFloat(balance).toFixed(code === 'XLM' ? 4 : 2)} ${code}`;
}
