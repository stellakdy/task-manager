'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Task, TaskStatus } from '@/core/ports/taskRepository';
import { CATEGORY_STYLES } from '@/utils/categories';
import { getUrgency, formatTimeLeft, UrgencyLevel } from '@/utils/time';
import UrgencyGauge from './UrgencyGauge';

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

interface Props {
  task: Task;
  onUpdate: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onUpdate, onDelete }: Props) {
  const [editing, setEditing]         = useState(false);
  const [editTitle, setEditTitle]     = useState(task.title);
  const [editDeadline, setEditDeadline] = useState(task.deadline.slice(0, 16));
  const [editNotes, setEditNotes]     = useState(task.notes ?? '');
  const [notesOpen, setNotesOpen]     = useState(false);

  const level    = getUrgency(task.deadline);
  const styles   = zoneStyles[level];
  const timeLeft = formatTimeLeft(task.deadline);
  const hasNotes = !!task.notes?.trim();
  const catStyle = CATEGORY_STYLES[task.category ?? '기타'];

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
    setEditDeadline(task.deadline.slice(0, 16));
    setEditNotes(task.notes ?? '');
    setEditing(false);
  }

  return (
    <div className={`rounded-xl border-2 p-4 shadow-sm transition-all duration-500 ${styles.card}`}>
      {editing ? (
        <div className="space-y-2">
          <input
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="제목"
            autoFocus
          />
          <input
            type="datetime-local"
            max="9999-12-31T23:59"
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            rows={2}
            placeholder="메모 (선택사항)"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={saveEdit}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">
              <Check size={12} /> 저장
            </button>
            <button onClick={cancelEdit}
              className="flex items-center gap-1 rounded-lg bg-gray-200 dark:bg-slate-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-500">
              <X size={12} /> 취소
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 제목 + 액션 */}
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-semibold text-sm leading-snug flex-1 ${styles.text} ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditing(true)}
                className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="수정">
                <Pencil size={13} className={styles.text} />
              </button>
              <button onClick={() => onDelete(task.id)}
                className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="삭제">
                <Trash2 size={13} className={styles.text} />
              </button>
            </div>
          </div>

          {/* 배지 행 */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {/* 카테고리 배지 */}
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold border"
              style={{
                backgroundColor: catStyle.bg,
                color:           catStyle.text,
                borderColor:     catStyle.border,
              }}
            >
              {task.category ?? '기타'}
            </span>

            {/* 상태 배지 (클릭으로 토글) */}
            <button
              onClick={() => onUpdate(task.id, { status: statusCycle[task.status] })}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles.badge} hover:opacity-80 transition-opacity`}
            >
              {statusLabels[task.status]}
            </button>

            {/* 남은 시간 */}
            <span className={`text-xs font-mono font-semibold ${styles.text}`}>{timeLeft}</span>

            {!task.isSynced && (
              <span className="ml-auto text-[10px] text-gray-400 dark:text-slate-500">미동기화</span>
            )}
          </div>

          {/* 게이지 */}
          <div className="mt-3">
            <UrgencyGauge deadline={task.deadline} createdAt={task.createdAt} />
          </div>

          {/* 메모 토글 */}
          <button
            onClick={() => setNotesOpen((v) => !v)}
            className={`mt-2 flex items-center gap-1 text-[11px] ${styles.text} opacity-50 hover:opacity-100 transition-opacity`}
          >
            {notesOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {hasNotes ? '메모 보기' : '메모 추가'}
          </button>

          {notesOpen && (
            <div className="mt-1.5">
              {hasNotes ? (
                <p className={`text-xs leading-relaxed whitespace-pre-wrap ${styles.text} opacity-70`}>
                  {task.notes}
                </p>
              ) : (
                <button onClick={() => setEditing(true)}
                  className={`text-xs ${styles.text} opacity-40 hover:opacity-70 italic`}>
                  클릭하여 메모를 입력하세요…
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
