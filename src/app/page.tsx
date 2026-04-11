'use client';

import { useState, useCallback } from 'react';
import { Plus, X, Search, Trash2, Sun, Moon, List, CalendarDays, Clock, BarChart3, Trash } from 'lucide-react';
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
import { CATEGORIES, CATEGORY_STYLES } from '@/utils/categories';
import type { TaskStatus, TaskCategory, Priority, RepeatRule } from '@/core/ports/taskRepository';

// ── 상수 ──

const STATUS_FILTERS: { label: string; value: FilterStatus }[] = [
  { label: '전체',   value: 'all'         },
  { label: '할 일',  value: 'todo'        },
  { label: '진행 중', value: 'in-progress' },
  { label: '완료',   value: 'done'        },
];

type ViewTab = 'list' | 'calendar' | 'timeline' | 'report' | 'trash';

const TABS: { key: ViewTab; label: string; icon: React.ReactNode }[] = [
  { key: 'list',     label: '목록',     icon: <List size={14} /> },
  { key: 'calendar', label: '캘린더',   icon: <CalendarDays size={14} /> },
  { key: 'timeline', label: '타임라인', icon: <Clock size={14} /> },
  { key: 'report',   label: '리포트',   icon: <BarChart3 size={14} /> },
  { key: 'trash',    label: '휴지통',   icon: <Trash size={14} /> },
];

// ── 유틸 ──

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultDeadline(): string {
  return toLocalDatetimeValue(new Date(Math.ceil(Date.now() / 60000) * 60000));
}

const PRESETS = [
  { label: '1시간 후',  fn: () => new Date(Date.now() + 60 * 60 * 1000) },
  { label: '3시간 후',  fn: () => new Date(Date.now() + 3 * 60 * 60 * 1000) },
  { label: '오늘 자정', fn: () => { const d = new Date(); d.setHours(23, 59, 0, 0); return d; } },
  { label: '내일 자정', fn: () => { const d = new Date(); d.setDate(d.getDate()+1); d.setHours(23, 59, 0, 0); return d; } },
  { label: '3일 후',   fn: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
];

// ── Sortable wrapper ──

function SortableTaskCard(props: React.ComponentProps<typeof TaskCard> & { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard {...props} dragHandleProps={listeners} />
    </div>
  );
}

// ── 메인 페이지 ──

export default function DashboardPage() {
  const {
    tasks, allTasks,
    filter, setFilter,
    categoryFilter, setCategoryFilter,
    searchQuery, setSearchQuery,
    tagFilter, setTagFilter,
    allTags,
    stats, unsyncedCount,
    addTask, updateTask, deleteTask, deleteDoneTasks,
    duplicateTask,
    startTimeTracking, stopTimeTracking,
    reorderTasks,
    getTrash, restoreTask, emptyTrash,
    exportJSON, importJSON, syncToServer,
  } = useTasks();

  const { dark, toggle: toggleTheme } = useTheme();
  const pomodoro = usePomodoro();

  const [activeTab, setActiveTab] = useState<ViewTab>('list');
  const [showForm,   setShowForm]   = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // 폼 상태
  const [title,      setTitle]      = useState('');
  const [notes,      setNotes]      = useState('');
  const [deadline,   setDeadline]   = useState(defaultDeadline);
  const [category,   setCategory]   = useState<TaskCategory>('기타');
  const [status,     setStatus]     = useState<TaskStatus>('todo');
  const [priority,   setPriority]   = useState<Priority>('normal');
  const [formTags,   setFormTags]   = useState<string[]>([]);
  const [repeatType, setRepeatType] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [submitting, setSubmitting] = useState(false);

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    await reorderTasks(newOrder);
  }, [tasks, reorderTasks]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !deadline) return;
    setSubmitting(true);

    const repeat: RepeatRule | undefined = repeatType !== 'none'
      ? { type: repeatType, interval: 1 }
      : undefined;

    await addTask({
      title: title.trim(),
      notes: notes.trim(),
      category,
      deadline: new Date(deadline).toISOString(),
      status,
      priority,
      tags: formTags,
      repeat,
    });

    setTitle(''); setNotes(''); setDeadline(defaultDeadline()); setCategory('기타');
    setStatus('todo'); setPriority('normal'); setFormTags([]); setRepeatType('none');
    setShowForm(false);
    setSubmitting(false);
  }

  const doneCount = stats.done;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* ── 헤더 ── */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">할 일 관리</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              할 일 {allTasks.length}개 · 긴급도 순 정렬
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme}
              className="rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
              title={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <NotificationBell />
            <button onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl bg-gray-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-gray-700 dark:hover:bg-slate-200 transition-colors">
              {showForm ? <X size={15} /> : <Plus size={15} />}
              {showForm ? '취소' : '할 일 추가'}
            </button>
          </div>
        </div>

        {/* ── 통계 카드 ── */}
        {allTasks.length > 0 && (
          <div className="mb-5">
            <StatsBar stats={stats} />
          </div>
        )}

        {/* ── 잔디 히트맵 (토글) ── */}
        <div className="mb-5">
          <button onClick={() => setShowHeatmap((v) => !v)}
            className="w-full text-left text-xs font-medium text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 mb-2 transition-colors">
            {showHeatmap ? '▲ 활동 기록 접기' : '▼ 활동 기록 보기'}
          </button>
          {showHeatmap && <HeatmapCalendar tasks={allTasks} />}
        </div>

        {/* ── 할 일 추가 폼 ── */}
        {showForm && (
          <form onSubmit={handleAdd}
            className="mb-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">새 할 일</h2>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">제목</label>
              <input type="text" placeholder="무엇을 해야 하나요?"
                value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-slate-400" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">마감 시간</label>
              <input type="datetime-local" value={deadline} max="9999-12-31T23:59"
                onChange={(e) => setDeadline(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {PRESETS.map(({ label, fn }) => (
                  <button key={label} type="button" onClick={() => setDeadline(toLocalDatetimeValue(fn()))}
                    className="rounded-full border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 카테고리 + 상태 + 우선순위 */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[100px]">
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">카테고리</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="min-w-[80px]">
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">상태</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                  <option value="todo">할 일</option>
                  <option value="in-progress">진행 중</option>
                  <option value="done">완료</option>
                </select>
              </div>
              <div className="min-w-[80px]">
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">우선순위</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}
                  className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                  <option value="high">높음</option>
                  <option value="normal">보통</option>
                  <option value="low">낮음</option>
                </select>
              </div>
            </div>

            {/* 반복 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">반복</label>
              <select value={repeatType} onChange={(e) => setRepeatType(e.target.value as typeof repeatType)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="none">반복 없음</option>
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
              </select>
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                태그 <span className="text-gray-400 dark:text-slate-500 font-normal">(선택사항)</span>
              </label>
              <div className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2">
                <TagInput tags={formTags} onChange={setFormTags} allTags={allTags} />
              </div>
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                메모 <span className="text-gray-400 dark:text-slate-500 font-normal">(선택사항)</span>
              </label>
              <textarea placeholder="참고 링크, 세부 내용, 주의사항 등"
                value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full rounded-lg bg-gray-900 dark:bg-slate-100 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-gray-700 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors">
              {submitting ? '추가 중…' : '추가하기'}
            </button>
          </form>
        )}

        {/* ── 데이터 & 동기화 ── */}
        <div className="mb-5">
          <SyncButton unsyncedCount={unsyncedCount} onExport={exportJSON} onImport={importJSON} onSync={syncToServer} />
        </div>

        {/* ── 탭 네비게이션 ── */}
        <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 dark:bg-slate-800 p-1">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 flex-1 justify-center rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}>
              {icon} <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── 목록 뷰 ── */}
        {activeTab === 'list' && (
          <>
            {/* 검색 바 */}
            <div className="mb-4 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input type="text" placeholder="제목, 메모 또는 태그로 검색…"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-slate-500" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* 상태 필터 + 완료 일괄 삭제 */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex gap-1.5 flex-wrap">
                {STATUS_FILTERS.map(({ label, value }) => (
                  <button key={value} onClick={() => setFilter(value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filter === value
                        ? 'bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              {doneCount > 0 && (
                <button onClick={() => { if (confirm(`완료된 ${doneCount}개의 할 일을 모두 삭제하시겠습니까?`)) deleteDoneTasks(); }}
                  className="flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors shrink-0">
                  <Trash2 size={11} /> 완료 {doneCount}개 삭제
                </button>
              )}
            </div>

            {/* 카테고리 필터 */}
            <div className="mb-2 flex gap-1.5 flex-wrap">
              <button onClick={() => setCategoryFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}>
                전체 카테고리
              </button>
              {CATEGORIES.map((cat) => {
                const s = CATEGORY_STYLES[cat];
                const isActive = categoryFilter === cat;
                return (
                  <button key={cat} onClick={() => setCategoryFilter(cat as FilterCategory)}
                    style={isActive ? { backgroundColor: s.dot, borderColor: s.dot, color: '#fff' } : {}}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                      isActive ? '' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}>
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* 태그 필터 */}
            {allTags.length > 0 && (
              <div className="mb-4 flex gap-1.5 flex-wrap">
                {tagFilter && (
                  <button onClick={() => setTagFilter(null)}
                    className="rounded-full bg-gray-900 dark:bg-slate-100 px-3 py-1 text-xs font-medium text-white dark:text-slate-900">
                    #{tagFilter} ✕
                  </button>
                )}
                {allTags.filter((t) => t !== tagFilter).map((tag) => (
                  <button key={tag} onClick={() => setTagFilter(tag)}
                    className="rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* 할 일 목록 (DnD) */}
            {tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-16 text-center">
                {searchQuery ? (
                  <>
                    <p className="text-sm text-gray-400 dark:text-slate-500">검색 결과가 없습니다.</p>
                    <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">&quot;{searchQuery}&quot; 에 해당하는 할 일이 없어요.</p>
                  </>
                ) : (filter !== 'all' || categoryFilter !== 'all' || tagFilter) ? (
                  <>
                    <p className="text-sm text-gray-400 dark:text-slate-500">해당 필터에 맞는 할 일이 없습니다.</p>
                    <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">다른 필터를 선택하거나 새 할 일을 추가하세요.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 dark:text-slate-500">등록된 할 일이 없습니다.</p>
                    <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">&quot;할 일 추가&quot; 버튼을 눌러 시작하세요.</p>
                  </>
                )}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        id={task.id}
                        task={task}
                        onUpdate={updateTask}
                        onDelete={deleteTask}
                        onDuplicate={duplicateTask}
                        onStartTracking={startTimeTracking}
                        onStopTracking={stopTimeTracking}
                        pomodoroPhase={pomodoro.phase}
                        pomodoroSecondsLeft={pomodoro.secondsLeft}
                        pomodoroRound={pomodoro.round}
                        pomodoroTotalRounds={pomodoro.totalRounds}
                        pomodoroIsRunning={pomodoro.isRunning}
                        pomodoroTaskId={pomodoro.taskId}
                        onPomodoroStart={pomodoro.start}
                        onPomodoroPause={pomodoro.pause}
                        onPomodoroResume={pomodoro.resume}
                        onPomodoroStop={pomodoro.stop}
                        onPomodoroSkip={pomodoro.skip}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </>
        )}

        {/* ── 캘린더 뷰 ── */}
        {activeTab === 'calendar' && <CalendarView tasks={allTasks} />}

        {/* ── 타임라인 뷰 ── */}
        {activeTab === 'timeline' && <TimelineView tasks={allTasks} />}

        {/* ── 리포트 뷰 ── */}
        {activeTab === 'report' && <WeeklyReport tasks={allTasks} />}

        {/* ── 휴지통 뷰 ── */}
        {activeTab === 'trash' && (
          <TrashBin getTrash={getTrash} onRestore={restoreTask} onEmpty={emptyTrash} />
        )}
      </div>
    </main>
  );
}
