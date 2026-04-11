'use client';

import { Play, Square } from 'lucide-react';
import type { TimeSession } from '@/core/ports/taskRepository';
import { t } from '@/utils/i18n';
import type { Locale } from '@/utils/i18n';

interface Props {
  taskId: string;
  sessions: TimeSession[];
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  locale: Locale;
}

function formatDuration(ms: number, locale: Locale): string {
  if (ms < 60000) return t('lessThan1Min', locale);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return t('timeDurH', locale, { h, m });
  return t('timeDurM', locale, { m });
}

function getTotalMs(sessions: TimeSession[]): number {
  return sessions.reduce((sum, s) => {
    const start = new Date(s.start).getTime();
    const end = s.end ? new Date(s.end).getTime() : Date.now();
    return sum + (end - start);
  }, 0);
}

export default function TimeTracker({ taskId, sessions, onStart, onStop, locale }: Props) {
  const isTracking = sessions.length > 0 && !sessions[sessions.length - 1].end;
  const totalMs = getTotalMs(sessions);

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => isTracking ? onStop(taskId) : onStart(taskId)}
        className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-colors ${
          isTracking
            ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900'
            : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-600'
        }`}
        title={isTracking ? t('timeStop', locale) : t('timeStart', locale)}
      >
        {isTracking ? (
          <>
            <Square size={10} className="fill-current" />
            <span className="animate-pulse">{t('tracking', locale)}</span>
          </>
        ) : (
          <>
            <Play size={10} /> {t('timeTrack', locale)}
          </>
        )}
      </button>
      {totalMs > 0 && (
        <span className="text-[10px] text-gray-400 dark:text-slate-500">
          {t('totalTime', locale)} {formatDuration(totalMs, locale)}
        </span>
      )}
    </div>
  );
}
