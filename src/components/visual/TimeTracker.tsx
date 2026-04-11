'use client';

import { Play, Square } from 'lucide-react';
import type { TimeSession } from '@/core/ports/taskRepository';

interface Props {
  taskId: string;
  sessions: TimeSession[];
  onStart: (id: string) => void;
  onStop: (id: string) => void;
}

function formatDuration(ms: number): string {
  if (ms < 60000) return '1분 미만';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function getTotalMs(sessions: TimeSession[]): number {
  return sessions.reduce((sum, s) => {
    const start = new Date(s.start).getTime();
    const end = s.end ? new Date(s.end).getTime() : Date.now();
    return sum + (end - start);
  }, 0);
}

export default function TimeTracker({ taskId, sessions, onStart, onStop }: Props) {
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
        title={isTracking ? '작업 시간 기록 정지' : '작업 시간 기록 시작'}
      >
        {isTracking ? (
          <>
            <Square size={10} className="fill-current" />
            <span className="animate-pulse">기록 중</span>
          </>
        ) : (
          <>
            <Play size={10} /> 시간 기록
          </>
        )}
      </button>
      {totalMs > 0 && (
        <span className="text-[10px] text-gray-400 dark:text-slate-500">
          총 {formatDuration(totalMs)}
        </span>
      )}
    </div>
  );
}
