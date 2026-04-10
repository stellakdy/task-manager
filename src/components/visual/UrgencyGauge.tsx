'use client';

import { getUrgency, getUrgencyPercent, UrgencyLevel } from '@/utils/time';

const barColors: Record<UrgencyLevel, string> = {
  safe:     '#3B82F6',
  moderate: '#22C55E',
  warning:  '#F59E0B',
  critical: '#EF4444',
  overdue:  '#8B5CF6',
};

interface Props {
  deadline: string;
  createdAt?: string;
}

export default function UrgencyGauge({ deadline, createdAt }: Props) {
  const level = getUrgency(deadline);
  const percent = getUrgencyPercent(deadline, createdAt);
  const color = barColors[level];

  return (
    <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}
