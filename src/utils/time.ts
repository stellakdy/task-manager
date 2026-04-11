import { t } from '@/utils/i18n';
import type { Locale } from '@/utils/i18n';

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

export function formatTimeLeft(deadline: string, locale: Locale = 'ko'): string {
  const msLeft = new Date(deadline).getTime() - Date.now();
  if (msLeft < 0) return t('overdue', locale);

  const totalMinutes = Math.floor(msLeft / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return t('daysHours', locale, { d: days, h: hours });
  if (hours > 0) return t('hoursMinutes', locale, { h: hours, m: minutes });
  if (minutes > 0) return t('minutesOnly', locale, { m: minutes });
  return t('justNow', locale);
}

export function urgencyWeight(deadline: string): number {
  const level = getUrgency(deadline);
  const order: Record<UrgencyLevel, number> = {
    overdue: 0, critical: 1, warning: 2, moderate: 3, safe: 4,
  };
  return order[level];
}
