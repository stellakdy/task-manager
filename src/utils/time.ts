export type UrgencyLevel = 'safe' | 'moderate' | 'warning' | 'critical' | 'overdue';

const HOUR = 3600000;
const DAY = 86400000;

export function getUrgency(deadline: string): UrgencyLevel {
  const msLeft = new Date(deadline).getTime() - Date.now();
  if (msLeft < 0)         return 'overdue';
  if (msLeft < 3 * HOUR)  return 'critical';
  if (msLeft < DAY)       return 'warning';
  if (msLeft < 3 * DAY)   return 'moderate';
  return 'safe';
}

/**
 * Returns 0–100 where 0 = just created, 100 = at or past deadline.
 * Falls back to a 7-day window if createdAt is missing.
 */
export function getUrgencyPercent(deadline: string, createdAt?: string): number {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const start = createdAt
    ? new Date(createdAt).getTime()
    : end - 7 * DAY;

  const total = end - start;
  if (total <= 0) return 100;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function formatTimeLeft(deadline: string): string {
  const msLeft = new Date(deadline).getTime() - Date.now();
  if (msLeft < 0) return '기한 초과';

  const totalMinutes = Math.floor(msLeft / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Sort weight: lower = more urgent. Overdue floats to top, safe to bottom. */
export function urgencyWeight(deadline: string): number {
  const level = getUrgency(deadline);
  const order: Record<UrgencyLevel, number> = {
    overdue: 0,
    critical: 1,
    warning: 2,
    moderate: 3,
    safe: 4,
  };
  return order[level];
}
