'use client';

import { useState, useEffect, memo } from 'react';
import { Pencil, Trash2, Check, X, ChevronDown, ChevronUp, Pin, Copy, GripVertical } from 'lucide-react';
import type { Task, TaskStatus, Priority } from '@/core/ports/taskRepository';
import { CATEGORY_STYLES } from '@/utils/categories';
import { getUrgency, formatTimeLeft, UrgencyLevel } from '@/utils/time';
import UrgencyGauge from './UrgencyGauge';
import SubtaskList from './SubtaskList';
import PomodoroTimer from './PomodoroTimer';
import TimeTracker from './TimeTracker';
import type { PomodoroPhase } from '@/hooks/usePomodoro';

// ISO → 로컬 datetime-local
function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const zoneStyles: Record<UrgencyLevel, { card: string; text: string; badge: string }> = {
  safe:     { card: 'bg-safe-card border-safe-border',         text: 'text-safe-text',     badge: 'bg-blue-100 text-blue-800'   },
  moderate: { card: 'bg-moderate-card border-moderate-border', text: 'text-moderate-text', badge: 'bg-green-100 text-green-800' },
  warning:  { card: 'bg-warning-card border-warning-border',   text: 'text-warning-text',  badge: 'bg-yellow-100 text-yellow-800' },
  critical: { card: 'bg-critical-card border-critical-border animate-glow', text: 'text-critical-text', badge: 'bg-red-100 text-red-800' },
  overdue:  { card: 'bg-overdue-card border-overdue-border',   text: 'text-overdue-text',  badge: 'bg-purple-100 text-purple-800' },
};

const statusLabels: Record<TaskStatus, string> = {
  'todo': '할 일', 'in-progress': '진행 중', 'done': '완료',
};
const statusCycle: Record<TaskStatus, TaskStatus> = {
  'todo': 'in-progress', 'in-progress': 'done', 'done': 'todo',
};

const priorityLabels: Record<Priority, string> = {
  high: '높음', normal: '보통', low: '낮음',
};
const priorityColors: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  normal: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
  low: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
};

interface Props {
  task: Task;
  onUpdate: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStartTracking: (id: string) => void;
  onStopTracking: (id: string) => void;
  // 포모도로
  pomodoroPhase: PomodoroPhase;
  pomodoroSecondsLeft: number;
  pomodoroRound: number;
  pomodoroTotalRounds: number;
  pomodoroIsRunning: boolean;
  pomodoroTaskId: string | null;
  onPomodoroStart: (id: string) => void;
  onPomodoroPause: () => void;
  onPomodoroResume: () => void;
  onPomodoroStop: () => void;
  onPomodoroSkip: () => void;
  // DnD
  dragHandleProps?: Record<string, unknown>;
}

function TaskCardInner({ task, onUpdate, onDelete, onDuplicate,
  onStartTracking, onStopTracking,
  pomodoroPhase, pomodoroSecondsLeft, pomodoroRound, pomodoroTotalRounds,
  pomodoroIsRunning, pomodoroTaskId,
  onPomodoroStart, onPomodoroPause, onPomodoroResume, onPomodoroStop, onPomodoroSkip,
  dragHandleProps,
}: Props) {
  const [editing, setEditing]         = useState(false);
  const [editTitle, setEditTitle]     = useState(task.title);
  const [editDeadline, setEditDeadline] = useState(toLocalDatetimeValue(task.deadline));
  const [editNotes, setEditNotes]     = useState(task.notes ?? '');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isDark, setIsDark]           = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const level    = getUrgency(task.deadline);
  const styles   = zoneStyles[level];
  const timeLeft = formatTimeLeft(task.deadline);
  const hasNotes = !!task.notes?.trim();
  const catStyle = CATEGORY_STYLES[task.category ?? '기타'];
  const hasSubtasks = task.subtasks.length > 0;
  const progress = hasSubtasks
    ? Math.round((task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100)
    : task.progress;

  function saveEdit() {
    if (!editTitle.trim() || !editDeadline) return;
    onUpdate(task.id, {
      title:    editTitle.trim(),
      deadline: new Date(editDeadline).toISOString(),
      notes:    editNotes,
    });
    setEditing(false);
  }

  function cancelEdit() {
    setEditTitle(task.title);
    setEditDeadline(toLocalDatetimeValue(task.deadline));
    setEditNotes(task.notes ?? '');
    setEditing(false);
  }

  return (
    <div className={`rounded-xl border-2 p-4 shadow-sm transition-all duration-500 ${styles.card} ${task.pinned ? 'ring-2 ring-yellow-400/50' : ''}`}>
      {editing ? (
        <div className="space-y-2">
          <input className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="제목" autoFocus />
          <input type="datetime-local" max="9999-12-31T23:59"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
          <textarea className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            rows={2} placeholder="메모 (선택사항)" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <button onClick={saveEdit} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"><Check size={12} /> 저장</button>
            <button onClick={cancelEdit} className="flex items-center gap-1 rounded-lg bg-gray-200 dark:bg-slate-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-500"><X size={12} /> 취소</button>
          </div>
        </div>
      ) : (
        <>
          {/* 제목 + 액션 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {/* 드래그 핸들 */}
              <div {...(dragHandleProps || {})} className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 shrink-0">
                <GripVertical size={14} />
              </div>
              {/* 핀 */}
              {task.pinned && <Pin size={12} className="text-yellow-500 shrink-0 -rotate-45" />}
              <h3 className={`font-semibold text-sm leading-snug truncate ${styles.text} ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                {task.title}
              </h3>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => onUpdate(task.id, { pinned: !task.pinned })}
                className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="고정"
                title={task.pinned ? '고정 해제' : '상단 고정'}>
                <Pin size={12} className={task.pinned ? 'text-yellow-500' : styles.text + ' opacity-40'} />
              </button>
              <button onClick={() => onDuplicate(task.id)}
                className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="복제" title="복제">
                <Copy size={12} className={styles.text + ' opacity-60'} />
              </button>
              <button onClick={() => setEditing(true)}
                className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="수정">
                <Pencil size={12} className={styles.text} />
              </button>
              <button onClick={() => { if (confirm('이 할 일을 삭제하시겠습니까?')) onDelete(task.id); }}
                className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="삭제">
                <Trash2 size={12} className={styles.text} />
              </button>
            </div>
          </div>

          {/* 배지 행 */}
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {/* 카테고리 */}
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold border"
              style={{
                backgroundColor: isDark ? catStyle.darkBg : catStyle.bg,
                color: isDark ? catStyle.darkText : catStyle.text,
                borderColor: isDark ? `${catStyle.darkText}40` : catStyle.border,
              }}>
              {task.category ?? '기타'}
            </span>

            {/* 우선순위 */}
            {task.priority !== 'normal' && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[task.priority]}`}>
                {priorityLabels[task.priority]}
              </span>
            )}

            {/* 상태 */}
            <button onClick={() => onUpdate(task.id, { status: statusCycle[task.status] })}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles.badge} hover:opacity-80 transition-opacity`}>
              {statusLabels[task.status]}
            </button>

            {/* 남은 시간 */}
            <span className={`text-[10px] font-mono font-semibold ${styles.text}`}>{timeLeft}</span>

            {/* 태그 */}
            {task.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 dark:bg-slate-600 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400">
                #{tag}
              </span>
            ))}

            {/* 반복 */}
            {task.repeat && (
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 text-[9px] font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                반복
              </span>
            )}

            {!task.isSynced && (
              <span className="ml-auto text-[9px] text-gray-400 dark:text-slate-500">미동기화</span>
            )}
          </div>

          {/* 진행률 바 */}
          {(progress > 0 || hasSubtasks) && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">{progress}%</span>
            </div>
          )}

          {/* 게이지 */}
          <div className="mt-2">
            <UrgencyGauge deadline={task.deadline} createdAt={task.createdAt} />
          </div>

          {/* 포모도로 + 시간 추적 */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <PomodoroTimer
              phase={pomodoroPhase} secondsLeft={pomodoroSecondsLeft}
              round={pomodoroRound} totalRounds={pomodoroTotalRounds}
              isRunning={pomodoroIsRunning} taskId={pomodoroTaskId}
              currentTaskId={task.id}
              onStart={onPomodoroStart} onPause={onPomodoroPause}
              onResume={onPomodoroResume} onStop={onPomodoroStop} onSkip={onPomodoroSkip}
            />
            <TimeTracker
              taskId={task.id} sessions={task.timeSessions ?? []}
              onStart={onStartTracking} onStop={onStopTracking}
            />
          </div>

          {/* 상세 토글 */}
          <button onClick={() => setDetailsOpen((v) => !v)}
            className={`mt-2 flex items-center gap-1 text-[11px] ${styles.text} opacity-50 hover:opacity-100 transition-opacity`}>
            {detailsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {hasNotes || hasSubtasks ? '상세 보기' : '상세 추가'}
          </button>

          {detailsOpen && (
            <div className="mt-1.5 space-y-2">
              {/* 메모 */}
              {hasNotes ? (
                <p className={`text-xs leading-relaxed whitespace-pre-wrap ${styles.text} opacity-70`}>{task.notes}</p>
              ) : (
                <button onClick={() => setEditing(true)} className={`text-xs ${styles.text} opacity-40 hover:opacity-70 italic`}>
                  클릭하여 메모를 입력하세요…
                </button>
              )}

              {/* 진행률 수동 조절 (서브태스크 없을 때) */}
              {!hasSubtasks && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 shrink-0">진행률</span>
                  <input type="range" min={0} max={100} step={5} value={task.progress}
                    onChange={(e) => onUpdate(task.id, { progress: Number(e.target.value) })}
                    className="flex-1 h-1 accent-green-500" />
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 w-8 text-right">{task.progress}%</span>
                </div>
              )}

              {/* 서브태스크 */}
              <SubtaskList
                subtasks={task.subtasks}
                onChange={(subtasks) => onUpdate(task.id, { subtasks })}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const TaskCard = memo(TaskCardInner);
export default TaskCard;
