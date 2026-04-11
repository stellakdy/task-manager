'use client';

import { useState, useCallback, useMemo } from 'react';
import { Plus, X, Search, Trash2, Sun, Moon, List, CalendarDays, Clock, BarChart3, Trash, ArrowUpDown, CheckSquare, Globe } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useTasks, FilterStatus, FilterCategory } from '@/hooks/useTasks';
import { useTheme } from '@/hooks/useTheme';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useLocale } from '@/hooks/useLocale';
import { t, LOCALE_LABELS } from '@/utils/i18n';
import type { Locale } from '@/utils/i18n';
import TaskCard from '@/components/visual/TaskCard';
import StatsBar from '@/components/visual/StatsBar';
import HeatmapCalendar from '@/components/visual/HeatmapCalendar';
import SyncButton from '@/components/migration/SyncButton';
import NotificationBell from '@/components/visual/NotificationBell';
import TagInput from '@/components/visual/TagInput';
import CalendarView from '@/components/visual/CalendarView';
import TimelineView from '@/components/visual/TimelineView';
import WeeklyReport from '@/components/visual/WeeklyReport';
import TrashBin from '@/components/visual/TrashBin';
import TodayWidget from '@/components/visual/TodayWidget';
import { CATEGORIES, CATEGORY_STYLES } from '@/utils/categories';
import type { TaskStatus, TaskCategory, Priority, RepeatRule, Task } from '@/core/ports/taskRepository';
import { urgencyWeight } from '@/utils/time';

// ── 타입 ──

type ViewTab = 'list' | 'calendar' | 'timeline' | 'report' | 'trash';
type SortOption = 'urgency' | 'deadline' | 'priority' | 'created' | 'name';

// ── 유틸 ──

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultDeadline(): string {
  return toLocalDatetimeValue(new Date(Math.ceil(Date.now() / 60000) * 60000));
}

function sortTasksBy(tasks: Task[], option: SortOption): Task[] {
  const sorted = [...tasks];
  const prioMap: Record<Priority, number> = { high: 0, normal: 1, low: 2 };
  switch (option) {
    case 'urgency':
      return sorted.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return urgencyWeight(a.deadline) - urgencyWeight(b.deadline) || new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    case 'deadline':
      return sorted.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    case 'priority':
      return sorted.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return prioMap[a.priority] - prioMap[b.priority];
      });
    case 'created':
      return sorted.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    case 'name':
      return sorted.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return a.title.localeCompare(b.title, 'ko');
      });
  }
}

// ── Sortable wrapper ──

function SortableTaskCard(props: React.ComponentProps<typeof TaskCard> & { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' as const };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard {...props} dragHandleProps={listeners} />
    </div>
  );
}

// ── 메인 ──

export default function DashboardPage() {
  const {
    tasks, allTasks,
    filter, setFilter, categoryFilter, setCategoryFilter,
    searchQuery, setSearchQuery, tagFilter, setTagFilter, allTags,
    stats, unsyncedCount,
    addTask, updateTask, deleteTask, deleteDoneTasks, duplicateTask,
    startTimeTracking, stopTimeTracking, reorderTasks,
    getTrash, restoreTask, emptyTrash,
    exportJSON, importJSON, syncToServer,
  } = useTasks();

  const { dark, toggle: toggleTheme } = useTheme();
  const pomodoro = usePomodoro();
  const { locale, setLocale } = useLocale();

  const [activeTab, setActiveTab] = useState<ViewTab>('list');
  const [showForm, setShowForm] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('urgency');

  // 일괄 편집
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 폼 상태
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [category, setCategory] = useState<TaskCategory>('기타');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<Priority>('normal');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [repeatType, setRepeatType] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [submitting, setSubmitting] = useState(false);

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // 정렬 적용
  const sortedTasks = useMemo(() => sortTasksBy(tasks, sortOption), [tasks, sortOption]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sortedTasks.map((t) => t.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    await reorderTasks(arrayMove(ids, oldIndex, newIndex));
  }, [sortedTasks, reorderTasks]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  async function bulkUpdateStatus(status: TaskStatus) {
    for (const id of Array.from(selectedIds)) await updateTask(id, { status });
    setSelectedIds(new Set());
  }

  async function bulkUpdatePriority(priority: Priority) {
    for (const id of Array.from(selectedIds)) await updateTask(id, { priority });
    setSelectedIds(new Set());
  }

  async function bulkUpdateCategory(category: TaskCategory) {
    for (const id of Array.from(selectedIds)) await updateTask(id, { category });
    setSelectedIds(new Set());
  }

  async function bulkDeleteSelected() {
    if (!confirm(t('confirmBulkDel', locale, { n: selectedIds.size }))) return;
    for (const id of Array.from(selectedIds)) await deleteTask(id);
    setSelectedIds(new Set());
    setBulkMode(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !deadline) return;
    setSubmitting(true);
    const repeat: RepeatRule | undefined = repeatType !== 'none' ? { type: repeatType, interval: 1 } : undefined;
    await addTask({ title: title.trim(), notes: notes.trim(), category, deadline: new Date(deadline).toISOString(), status, priority, tags: formTags, repeat });
    setTitle(''); setNotes(''); setDeadline(defaultDeadline()); setCategory('기타'); setStatus('todo'); setPriority('normal'); setFormTags([]); setRepeatType('none');
    setShowForm(false); setSubmitting(false);
  }

  const PRESETS = [
    { label: t('in1Hour', locale), fn: () => new Date(Date.now() + 60 * 60 * 1000) },
    { label: t('in3Hours', locale), fn: () => new Date(Date.now() + 3 * 60 * 60 * 1000) },
    { label: t('todayMidnight', locale), fn: () => { const d = new Date(); d.setHours(23, 59, 0, 0); return d; } },
    { label: t('tomorrowMidnight', locale), fn: () => { const d = new Date(); d.setDate(d.getDate()+1); d.setHours(23, 59, 0, 0); return d; } },
    { label: t('in3Days', locale), fn: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
  ];

  const TABS: { key: ViewTab; label: string; icon: React.ReactNode }[] = [
    { key: 'list', label: t('tabList', locale), icon: <List size={14} /> },
    { key: 'calendar', label: t('tabCalendar', locale), icon: <CalendarDays size={14} /> },
    { key: 'timeline', label: t('tabTimeline', locale), icon: <Clock size={14} /> },
    { key: 'report', label: t('tabReport', locale), icon: <BarChart3 size={14} /> },
    { key: 'trash', label: t('tabTrash', locale), icon: <Trash size={14} /> },
  ];

  const STATUS_FILTERS: { label: string; value: FilterStatus }[] = [
    { label: t('all', locale), value: 'all' },
    { label: t('todo', locale), value: 'todo' },
    { label: t('inProgress', locale), value: 'in-progress' },
    { label: t('done', locale), value: 'done' },
  ];

  const SORT_OPTIONS: { label: string; value: SortOption }[] = [
    { label: t('sortUrgency', locale), value: 'urgency' },
    { label: t('sortDeadline', locale), value: 'deadline' },
    { label: t('sortPriority', locale), value: 'priority' },
    { label: t('sortCreated', locale), value: 'created' },
    { label: t('sortName', locale), value: 'name' },
  ];

  const doneCount = stats.done;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* 헤더 */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">{t('appTitle', locale)}</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{t('taskCount', locale, { n: allTasks.length })}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {/* 언어 */}
            <div className="relative group">
              <button className="rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors" title="Language">
                <Globe size={16} />
              </button>
              <div className="absolute right-0 top-full pt-1 hidden group-hover:block z-50 w-28">
                <div className="rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-lg overflow-hidden">
                  {(['ko', 'en', 'ja'] as Locale[]).map((l) => (
                    <button key={l} onClick={() => setLocale(l)}
                      className={`block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors ${locale === l ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-300'}`}>
                      {LOCALE_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={toggleTheme}
              className="rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              title={dark ? t('lightMode', locale) : t('darkMode', locale)}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <NotificationBell />
            <button onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl bg-gray-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-gray-700 dark:hover:bg-slate-200 transition-colors">
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? t('cancel', locale) : t('addTask', locale)}
            </button>
          </div>
        </div>

        {/* 오늘의 할 일 위젯 */}
        {allTasks.length > 0 && (
          <div className="mb-3">
            <TodayWidget tasks={allTasks} locale={locale} />
          </div>
        )}

        {/* 통계 */}
        {allTasks.length > 0 && <div className="mb-5"><StatsBar stats={stats} /></div>}

        {/* 히트맵 */}
        <div className="mb-5">
          <button onClick={() => setShowHeatmap((v) => !v)}
            className="w-full text-left text-xs font-medium text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 mb-2 transition-colors">
            {showHeatmap ? t('heatmapHide', locale) : t('heatmapShow', locale)}
          </button>
          {showHeatmap && <HeatmapCalendar tasks={allTasks} locale={locale} />}
        </div>

        {/* 할 일 추가 폼 */}
        {showForm && (
          <form onSubmit={handleAdd} className="mb-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('newTask', locale)}</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{t('titleLabel', locale)}</label>
              <input type="text" placeholder={t('titlePlaceholder', locale)} value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{t('deadlineLabel', locale)}</label>
              <input type="datetime-local" value={deadline} max="9999-12-31T23:59" onChange={(e) => setDeadline(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {PRESETS.map(({ label, fn }) => (
                  <button key={label} type="button" onClick={() => setDeadline(toLocalDatetimeValue(fn()))}
                    className="rounded-full border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">{label}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[100px]">
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{t('categoryLabel', locale)}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="min-w-[80px]">
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{t('statusLabel', locale)}</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                  <option value="todo">{t('todo', locale)}</option>
                  <option value="in-progress">{t('inProgress', locale)}</option>
                  <option value="done">{t('done', locale)}</option>
                </select>
              </div>
              <div className="min-w-[80px]">
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{t('priorityLabel', locale)}</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}
                  className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                  <option value="high">{t('high', locale)}</option>
                  <option value="normal">{t('normal', locale)}</option>
                  <option value="low">{t('low', locale)}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{t('repeatLabel', locale)}</label>
              <select value={repeatType} onChange={(e) => setRepeatType(e.target.value as typeof repeatType)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="none">{t('noRepeat', locale)}</option>
                <option value="daily">{t('daily', locale)}</option>
                <option value="weekly">{t('weekly', locale)}</option>
                <option value="monthly">{t('monthly', locale)}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{t('tagsLabel', locale)} <span className="text-gray-400 dark:text-slate-500 font-normal">({t('optional', locale)})</span></label>
              <div className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2">
                <TagInput tags={formTags} onChange={setFormTags} allTags={allTags} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{t('notesLabel', locale)} <span className="text-gray-400 dark:text-slate-500 font-normal">({t('optional', locale)})</span></label>
              <textarea placeholder={t('notesPlaceholder', locale)} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full rounded-lg bg-gray-900 dark:bg-slate-100 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-gray-700 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors">
              {submitting ? t('adding', locale) : t('add', locale)}
            </button>
          </form>
        )}

        <div className="mb-5"><SyncButton unsyncedCount={unsyncedCount} onExport={exportJSON} onImport={importJSON} onSync={syncToServer} locale={locale} /></div>

        {/* 탭 */}
        <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 dark:bg-slate-800 p-1">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => { setActiveTab(key); setBulkMode(false); setSelectedIds(new Set()); }}
              className={`flex items-center gap-1.5 flex-1 justify-center rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                activeTab === key ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}>
              {icon} <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ══ 목록 뷰 ══ */}
        {activeTab === 'list' && (
          <>
            <div className="mb-4 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input type="text" placeholder={t('searchPlaceholder', locale)}
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-slate-500" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
            </div>

            {/* 정렬 + 일괄편집 토글 */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                  <ArrowUpDown size={12} />
                  <select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-transparent text-xs font-medium text-gray-600 dark:text-slate-300 focus:outline-none cursor-pointer">
                    {SORT_OPTIONS.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => { setBulkMode((v) => !v); setSelectedIds(new Set()); }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  bulkMode ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}>
                <CheckSquare size={14} /> {bulkMode ? t('cancel', locale) : t('bulkEdit', locale)}
              </button>
            </div>

            {/* 일괄 편집 바 */}
            {bulkMode && (
              <div className="mb-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 p-3 shadow-inner">
                {selectedIds.size > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 mr-2">{t('bulkSelected', locale, { n: selectedIds.size })}</span>
                    <select onChange={(e) => { if (e.target.value) bulkUpdateStatus(e.target.value as TaskStatus); e.target.value = ''; }}
                      className="rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow">
                      <option value="">{t('statusLabel', locale)}</option>
                      <option value="todo">{t('todo', locale)}</option>
                      <option value="in-progress">{t('inProgress', locale)}</option>
                      <option value="done">{t('done', locale)}</option>
                    </select>
                    <select onChange={(e) => { if (e.target.value) bulkUpdatePriority(e.target.value as Priority); e.target.value = ''; }}
                      className="rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow">
                      <option value="">{t('priorityLabel', locale)}</option>
                      <option value="high">{t('high', locale)}</option>
                      <option value="normal">{t('normal', locale)}</option>
                      <option value="low">{t('low', locale)}</option>
                    </select>
                    <select onChange={(e) => { if (e.target.value) bulkUpdateCategory(e.target.value as TaskCategory); e.target.value = ''; }}
                      className="rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow">
                      <option value="">{t('categoryLabel', locale)}</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex-1" />
                    <button onClick={bulkDeleteSelected}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 transition-colors">
                      <Trash2 size={13} /> {t('bulkDelete', locale)}
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-sm font-medium text-blue-600 dark:text-blue-400 py-1">
                    {locale === 'ko' ? '원하는 할 일 카드를 클릭하여 선택하세요.' : locale === 'en' ? 'Click on task cards to select.' : 'タスクカードをクリックして選択してください。'}
                  </div>
                )}
              </div>
            )}

            {/* 상태 필터 */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex gap-1.5 flex-wrap">
                {STATUS_FILTERS.map(({ label, value }) => (
                  <button key={value} onClick={() => setFilter(value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filter === value ? 'bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}>{label}</button>
                ))}
              </div>
              {doneCount > 0 && (
                <button onClick={() => { if (confirm(t('confirmBulkDel', locale, { n: doneCount }))) deleteDoneTasks(); }}
                  className="flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors shrink-0">
                  <Trash2 size={11} /> {t('deleteDone', locale, { n: doneCount })}
                </button>
              )}
            </div>

            {/* 카테고리 필터 */}
            <div className="mb-2 flex gap-1.5 flex-wrap">
              <button onClick={() => setCategoryFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${categoryFilter === 'all' ? 'bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                {t('allCategory', locale)}
              </button>
              {CATEGORIES.map((cat) => {
                const s = CATEGORY_STYLES[cat];
                const isActive = categoryFilter === cat;
                return (
                  <button key={cat} onClick={() => setCategoryFilter(cat as FilterCategory)}
                    style={isActive ? { backgroundColor: s.dot, borderColor: s.dot, color: '#fff' } : {}}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${isActive ? '' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* 태그 필터 */}
            {allTags.length > 0 && (
              <div className="mb-4 flex gap-1.5 flex-wrap">
                {tagFilter && <button onClick={() => setTagFilter(null)} className="rounded-full bg-gray-900 dark:bg-slate-100 px-3 py-1 text-xs font-medium text-white dark:text-slate-900">#{tagFilter} ✕</button>}
                {allTags.filter((tg) => tg !== tagFilter).map((tag) => (
                  <button key={tag} onClick={() => setTagFilter(tag)} className="rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">#{tag}</button>
                ))}
              </div>
            )}

            {/* 할 일 목록 */}
            {sortedTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-16 text-center">
                {searchQuery ? (
                  <><p className="text-sm text-gray-400 dark:text-slate-500">{t('noResults', locale)}</p><p className="text-xs text-gray-300 dark:text-slate-600 mt-1">&quot;{searchQuery}&quot; {t('noResultsHint', locale)}</p></>
                ) : (filter !== 'all' || categoryFilter !== 'all' || tagFilter) ? (
                  <><p className="text-sm text-gray-400 dark:text-slate-500">{t('noFilterResults', locale)}</p><p className="text-xs text-gray-300 dark:text-slate-600 mt-1">{t('noFilterHint', locale)}</p></>
                ) : (
                  <><p className="text-sm text-gray-400 dark:text-slate-500">{t('noTasks', locale)}</p><p className="text-xs text-gray-300 dark:text-slate-600 mt-1">{t('noTasksHint', locale)}</p></>
                )}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {sortedTasks.map((task) => (
                      <SortableTaskCard key={task.id} id={task.id} task={task} locale={locale} allTags={allTags}
                        onUpdate={updateTask} onDelete={deleteTask} onDuplicate={duplicateTask}
                        onStartTracking={startTimeTracking} onStopTracking={stopTimeTracking}
                        pomodoroPhase={pomodoro.phase} pomodoroSecondsLeft={pomodoro.secondsLeft}
                        pomodoroRound={pomodoro.round} pomodoroTotalRounds={pomodoro.totalRounds}
                        pomodoroIsRunning={pomodoro.isRunning} pomodoroTaskId={pomodoro.taskId}
                        onPomodoroStart={pomodoro.start} onPomodoroPause={pomodoro.pause}
                        onPomodoroResume={pomodoro.resume} onPomodoroStop={pomodoro.stop} onPomodoroSkip={pomodoro.skip}
                        bulkMode={bulkMode} selected={selectedIds.has(task.id)} onSelect={toggleSelect}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </>
        )}

        {activeTab === 'calendar' && <CalendarView tasks={allTasks} locale={locale} />}
        {activeTab === 'timeline' && <TimelineView tasks={allTasks} locale={locale} />}
        {activeTab === 'report' && <WeeklyReport tasks={allTasks} locale={locale} />}
        {activeTab === 'trash' && <TrashBin getTrash={getTrash} onRestore={restoreTask} onEmpty={emptyTrash} locale={locale} />}
      </div>
    </main>
  );
}
