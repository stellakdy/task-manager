'use client';

import { useState, useEffect, memo } from 'react';
import { Pencil, Trash2, Check, X, ChevronDown, ChevronUp, Pin, Copy, GripVertical, Link2, Plus, ExternalLink, CheckCircle } from 'lucide-react';
import type { Task, TaskStatus, Priority, TaskLink } from '@/core/ports/taskRepository';
import { CATEGORIES, CATEGORY_STYLES } from '@/utils/categories';
import type { TaskCategory } from '@/utils/categories';
import { getUrgency, formatTimeLeft, UrgencyLevel } from '@/utils/time';
import { t } from '@/utils/i18n';
import type { Locale } from '@/utils/i18n';
import UrgencyGauge from './UrgencyGauge';
import SubtaskList from './SubtaskList';
import TagInput from './TagInput';
import PomodoroTimer from './PomodoroTimer';
import TimeTracker from './TimeTracker';
import type { PomodoroPhase } from '@/hooks/usePomodoro';
import { v4 as uuid } from 'uuid';

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

const statusCycle: Record<TaskStatus, TaskStatus> = {
  'todo': 'in-progress', 'in-progress': 'done', 'done': 'todo',
};

const priorityColors: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  normal: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
  low: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
};

interface Props {
  task: Task;
  locale: Locale;
  allTags: string[];
  onUpdate: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStartTracking: (id: string) => void;
  onStopTracking: (id: string) => void;
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
  dragHandleProps?: Record<string, unknown>;
  selected?: boolean;
  onSelect?: (id: string) => void;
  bulkMode?: boolean;
}

function TaskCardInner({ task, locale, allTags, onUpdate, onDelete, onDuplicate,
  onStartTracking, onStopTracking,
  pomodoroPhase, pomodoroSecondsLeft, pomodoroRound, pomodoroTotalRounds,
  pomodoroIsRunning, pomodoroTaskId,
  onPomodoroStart, onPomodoroPause, onPomodoroResume, onPomodoroStop, onPomodoroSkip,
  dragHandleProps, selected, onSelect, bulkMode,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDeadline, setEditDeadline] = useState(toLocalDatetimeValue(task.deadline));
  const [editNotes, setEditNotes] = useState(task.notes ?? '');
  const [editCategory, setEditCategory] = useState<TaskCategory>(task.category);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editTags, setEditTags] = useState<string[]>(task.tags);
  const [editRepeat, setEditRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>(task.repeat?.type ?? 'none');
  const [editLinks, setEditLinks] = useState<TaskLink[]>(task.links ?? []);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const level = getUrgency(task.deadline);
  const styles = zoneStyles[level];
  const timeLeft = formatTimeLeft(task.deadline, locale);
  const hasNotes = !!task.notes?.trim();
  const catStyle = CATEGORY_STYLES[task.category ?? '기타'];
  const hasSubtasks = task.subtasks.length > 0;
  const progress = hasSubtasks
    ? Math.round((task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100)
    : task.progress;

  function handleStatusToggle() {
    const next = statusCycle[task.status];
    if (next === 'done') {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onUpdate(task.id, { status: next });
  }

  function saveEdit() {
    if (!editTitle.trim() || !editDeadline) return;
    onUpdate(task.id, {
      title: editTitle.trim(),
      deadline: new Date(editDeadline).toISOString(),
      notes: editNotes,
      category: editCategory,
      priority: editPriority,
      tags: editTags,
      repeat: editRepeat !== 'none' ? { type: editRepeat, interval: 1 } : undefined,
      links: editLinks,
    });
    setEditing(false);
  }

  function cancelEdit() {
    setEditTitle(task.title);
    setEditDeadline(toLocalDatetimeValue(task.deadline));
    setEditNotes(task.notes ?? '');
    setEditCategory(task.category);
    setEditPriority(task.priority);
    setEditTags(task.tags);
    setEditRepeat(task.repeat?.type ?? 'none');
    setEditLinks(task.links ?? []);
    setEditing(false);
  }

  function addLink() {
    setEditLinks([...editLinks, { id: uuid(), name: '', url: '' }]);
  }

  function updateLink(id: string, field: 'name' | 'url', value: string) {
    setEditLinks(editLinks.map((l) => l.id === id ? { ...l, [field]: value } : l));
  }

  function removeLink(id: string) {
    setEditLinks(editLinks.filter((l) => l.id !== id));
  }

  const inputClass = "w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400";

  const isSelected = bulkMode && selected;
  const cardBorder = isSelected ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : styles.card;
  const cardBg = isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20' : '';
  const bulkClasses = bulkMode ? 'cursor-pointer hover:border-blue-400' : '';

  function handleCardClick(e: React.MouseEvent) {
    if (!bulkMode || !onSelect || editing) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a')) return;
    onSelect(task.id);
  }

  return (
    <div className={`relative rounded-xl border-2 shadow-sm transition-all duration-300 overflow-hidden flex ${cardBorder} ${cardBg} ${bulkClasses} ${task.pinned ? 'ring-2 ring-yellow-400/50' : ''} ${justCompleted ? 'animate-complete' : ''}`}
      style={{ backgroundImage: isSelected ? 'none' : `linear-gradient(to right, ${catStyle.dot}10, transparent 40%)` }}
      onClick={handleCardClick}
    >
      {/* 카테고리 색상 바 */}
      <div className="w-2 shrink-0 transition-colors" style={{ backgroundColor: isSelected ? '#3B82F6' : catStyle.dot }} />
      {isSelected && (
        <div className="absolute bottom-3 right-3 text-blue-500 dark:text-blue-400 pointer-events-none opacity-20">
          <CheckCircle size={48} />
        </div>
      )}

      <div className="flex-1 p-4">
        {editing ? (
          <div className="space-y-2">
            {/* 제목 */}
            <input className={inputClass} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder={t('titleLabel', locale)} autoFocus />
            {/* 마감 */}
            <input type="datetime-local" max="9999-12-31T23:59" className={inputClass} value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
            {/* 카테고리 + 우선순위 + 반복 */}
            <div className="flex gap-2 flex-wrap">
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as TaskCategory)} className={inputClass + ' flex-1 min-w-[80px]'}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as Priority)} className={inputClass + ' w-20'}>
                <option value="high">{t('high', locale)}</option>
                <option value="normal">{t('normal', locale)}</option>
                <option value="low">{t('low', locale)}</option>
              </select>
              <select value={editRepeat} onChange={(e) => setEditRepeat(e.target.value as typeof editRepeat)} className={inputClass + ' w-24'}>
                <option value="none">{t('noRepeat', locale)}</option>
                <option value="daily">{t('daily', locale)}</option>
                <option value="weekly">{t('weekly', locale)}</option>
                <option value="monthly">{t('monthly', locale)}</option>
              </select>
            </div>
            {/* 태그 */}
            <div className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5">
              <TagInput tags={editTags} onChange={setEditTags} allTags={allTags} />
            </div>
            {/* 메모 */}
            <textarea className={inputClass + ' resize-none'} rows={2} placeholder={t('notesPlaceholder', locale)} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            {/* 파일/링크 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-slate-400">{t('linksLabel', locale)}</span>
                <button type="button" onClick={addLink} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"><Plus size={11} /> {t('addLink', locale)}</button>
              </div>
              {editLinks.map((link) => (
                <div key={link.id} className="flex gap-1.5 items-center">
                  <input placeholder={t('linkName', locale)} value={link.name} onChange={(e) => updateLink(link.id, 'name', e.target.value)}
                    className="flex-[2] rounded border border-gray-200 dark:border-slate-600 bg-transparent px-2 py-1 text-xs text-gray-700 dark:text-slate-300 focus:outline-none" />
                  <input placeholder={t('linkUrl', locale)} value={link.url} onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                    className="flex-[3] rounded border border-gray-200 dark:border-slate-600 bg-transparent px-2 py-1 text-xs text-gray-700 dark:text-slate-300 focus:outline-none" />
                  <button onClick={() => removeLink(link.id)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
            </div>
            {/* 저장/취소 */}
            <div className="flex gap-2 justify-end">
              <button onClick={saveEdit} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"><Check size={12} /> {t('save', locale)}</button>
              <button onClick={cancelEdit} className="flex items-center gap-1 rounded-lg bg-gray-200 dark:bg-slate-600 px-3 py-1 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-500"><X size={12} /> {t('cancel', locale)}</button>
            </div>
          </div>
        ) : (
          <>
            {/* 제목 + 액션 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div {...(dragHandleProps || {})} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 shrink-0">
                  <GripVertical size={14} />
                </div>
                {task.pinned && <Pin size={12} className="text-yellow-500 shrink-0 -rotate-45" />}
                <h3 className={`font-semibold text-sm leading-snug truncate ${styles.text} ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                  {task.title}
                </h3>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => onUpdate(task.id, { pinned: !task.pinned })}
                  className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  title={task.pinned ? t('unpinTask', locale) : t('pinTask', locale)}>
                  <Pin size={12} className={task.pinned ? 'text-yellow-500' : styles.text + ' opacity-40'} />
                </button>
                <button onClick={() => onDuplicate(task.id)}
                  className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title={t('duplicate', locale)}>
                  <Copy size={12} className={styles.text + ' opacity-60'} />
                </button>
                <button onClick={() => setEditing(true)}
                  className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label={t('edit', locale)}>
                  <Pencil size={12} className={styles.text} />
                </button>
                <button onClick={() => { if (confirm(t('confirmDelete', locale))) onDelete(task.id); }}
                  className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label={t('delete', locale)}>
                  <Trash2 size={12} className={styles.text} />
                </button>
              </div>
            </div>

            {/* 배지 행 */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold border"
                style={{
                  backgroundColor: isDark ? catStyle.darkBg : catStyle.bg,
                  color: isDark ? catStyle.darkText : catStyle.text,
                  borderColor: isDark ? `${catStyle.darkText}40` : catStyle.border,
                }}>
                {task.category ?? '기타'}
              </span>

              {task.priority !== 'normal' && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColors[task.priority]}`}>
                  {t(task.priority, locale)}
                </span>
              )}

              <button onClick={handleStatusToggle}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles.badge} hover:opacity-80 transition-opacity`}>
                {task.status === 'todo' ? t('todo', locale) : task.status === 'in-progress' ? t('inProgress', locale) : t('done', locale)}
              </button>

              <span className={`text-[10px] font-mono font-semibold ${styles.text}`}>{timeLeft}</span>

              {task.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 dark:bg-slate-600 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:text-slate-400">#{tag}</span>
              ))}

              {task.repeat && (
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 text-[9px] font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {t('repeatBadge', locale)}
                </span>
              )}

              {(task.links?.length ?? 0) > 0 && (
                <span className="text-[9px] text-gray-400 dark:text-slate-500 flex items-center gap-0.5"><Link2 size={9} />{task.links.length}</span>
              )}

              {!task.isSynced && <span className="ml-auto text-[9px] text-gray-400 dark:text-slate-500">{t('unsynced', locale)}</span>}
            </div>

            {/* 진행률 */}
            {(progress > 0 || hasSubtasks) && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">{progress}%</span>
              </div>
            )}

            <div className="mt-2"><UrgencyGauge deadline={task.deadline} createdAt={task.createdAt} /></div>

            {/* 포모도로 + 시간 추적 */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <PomodoroTimer phase={pomodoroPhase} secondsLeft={pomodoroSecondsLeft}
                round={pomodoroRound} totalRounds={pomodoroTotalRounds}
                isRunning={pomodoroIsRunning} taskId={pomodoroTaskId} currentTaskId={task.id}
                onStart={onPomodoroStart} onPause={onPomodoroPause} onResume={onPomodoroResume} onStop={onPomodoroStop} onSkip={onPomodoroSkip} locale={locale} />
              <TimeTracker taskId={task.id} sessions={task.timeSessions ?? []} onStart={onStartTracking} onStop={onStopTracking} locale={locale} />
            </div>

            {/* 상세 토글 */}
            <button onClick={() => setDetailsOpen((v) => !v)}
              className={`mt-2 flex items-center gap-1 text-[11px] ${styles.text} opacity-50 hover:opacity-100 transition-opacity`}>
              {detailsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {hasNotes || hasSubtasks || (task.links?.length ?? 0) > 0 ? t('detailsShow', locale) : t('detailsAdd', locale)}
            </button>

            {detailsOpen && (
              <div className="mt-1.5 space-y-2">
                {hasNotes && <p className={`text-xs leading-relaxed whitespace-pre-wrap ${styles.text} opacity-70`}>{task.notes}</p>}
                {!hasNotes && <button onClick={() => setEditing(true)} className={`text-xs ${styles.text} opacity-40 hover:opacity-70 italic`}>{t('clickToAddNotes', locale)}</button>}

                {/* 파일/링크 목록 */}
                {task.links?.length > 0 && (
                  <div className="space-y-1">
                    {task.links.map((link) => (
                      <a key={link.id} href={link.url.startsWith('http') ? link.url : `file:///${link.url}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        <ExternalLink size={10} />
                        {link.name || link.url}
                      </a>
                    ))}
                  </div>
                )}

                {!hasSubtasks && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 shrink-0">{t('progressLabel', locale)}</span>
                    <input type="range" min={0} max={100} step={5} value={task.progress}
                      onChange={(e) => onUpdate(task.id, { progress: Number(e.target.value) })}
                      className="flex-1 h-1 accent-green-500" />
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 w-8 text-right">{task.progress}%</span>
                  </div>
                )}

                <SubtaskList subtasks={task.subtasks} onChange={(subtasks) => onUpdate(task.id, { subtasks })} locale={locale} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const TaskCard = memo(TaskCardInner);
export default TaskCard;
