'use client';

import { Play, Pause, Square, SkipForward } from 'lucide-react';
import type { PomodoroPhase } from '@/hooks/usePomodoro';
import { t } from '@/utils/i18n';
import type { Locale } from '@/utils/i18n';

interface Props {
  phase: PomodoroPhase;
  secondsLeft: number;
  round: number;
  totalRounds: number;
  isRunning: boolean;
  taskId: string | null;
  currentTaskId: string;
  onStart: (taskId: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkip: () => void;
  locale: Locale;
}

const phaseColors: Record<PomodoroPhase, string> = {
  work: 'text-red-600 dark:text-red-400',
  break: 'text-green-600 dark:text-green-400',
  longBreak: 'text-blue-600 dark:text-blue-400',
  idle: 'text-gray-500 dark:text-slate-400',
};

const phaseKeys: Record<PomodoroPhase, 'work' | 'break_' | 'longBreak' | 'idle'> = {
  work: 'work',
  break: 'break_',
  longBreak: 'longBreak',
  idle: 'idle',
};

export default function PomodoroTimer({
  phase, secondsLeft, round, totalRounds,
  isRunning, taskId, currentTaskId,
  onStart, onPause, onResume, onStop, onSkip, locale,
}: Props) {
  const isActive = taskId === currentTaskId;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  if (!isActive) {
    return (
      <button
        onClick={() => onStart(currentTaskId)}
        disabled={taskId !== null && !isActive}
        className="flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 disabled:opacity-30 transition-colors"
        title={t('pomodoroStart', locale)}
      >
        <Play size={10} /> {t('pomodoro', locale)}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-2.5 py-1">
      <span className={`text-sm font-mono font-bold ${phaseColors[phase]}`}>
        {mm}:{ss}
      </span>
      <span className={`text-[10px] font-medium ${phaseColors[phase]}`}>
        {t(phaseKeys[phase], locale)} {phase !== 'idle' && `${round}/${totalRounds}`}
      </span>
      <div className="flex items-center gap-0.5">
        {isRunning ? (
          <button onClick={onPause} className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900 rounded" title={t('pomoPause', locale)}>
            <Pause size={12} className="text-red-600 dark:text-red-400" />
          </button>
        ) : (
          <button onClick={onResume} className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900 rounded" title={t('pomoResume', locale)}>
            <Play size={12} className="text-red-600 dark:text-red-400" />
          </button>
        )}
        <button onClick={onSkip} className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900 rounded" title={t('pomoSkip', locale)}>
          <SkipForward size={12} className="text-red-600 dark:text-red-400" />
        </button>
        <button onClick={onStop} className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900 rounded" title={t('pomoStop', locale)}>
          <Square size={12} className="text-red-600 dark:text-red-400" />
        </button>
      </div>
    </div>
  );
}
