'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { taskRepository } from '@/core/adapters/localAdapter';
import type { Task, TaskStatus, Priority, Subtask, RepeatRule } from '@/core/ports/taskRepository';
import type { TaskCategory } from '@/utils/categories';
import { urgencyWeight } from '@/utils/time';
import { getNotificationEnabled } from '@/components/visual/NotificationBell';
import { v4 as uuid } from 'uuid';

export type FilterStatus   = 'all' | TaskStatus;
export type FilterCategory = 'all' | TaskCategory;

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 핀 고정 우선
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    // 우선순위
    const prio: Record<Priority, number> = { high: 0, normal: 1, low: 2 };
    if (prio[a.priority] !== prio[b.priority]) return prio[a.priority] - prio[b.priority];
    // 긴급도
    const wa = urgencyWeight(a.deadline);
    const wb = urgencyWeight(b.deadline);
    if (wa !== wb) return wa - wb;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

function sendNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (!getNotificationEnabled()) return;
  new Notification(title, { body, icon: '/favicon.ico' });
}

export function useTasks() {
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [filter, setFilter]             = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [tagFilter, setTagFilter]       = useState<string | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  // 마운트 시 로드
  useEffect(() => {
    taskRepository.getAll().then((loaded) => {
      setTasks(loaded);
      loaded.filter((t) => t.notified).forEach((t) => notifiedRef.current.add(t.id));
    });
  }, []);

  // 1분 ticker + 브라우저 알림 + 반복 작업 체크
  useEffect(() => {
    const tick = async () => {
      const all = await taskRepository.getAll();

      // 알림 체크
      const toNotify = all.filter((t) => {
        if (t.status === 'done') return false;
        if (notifiedRef.current.has(t.id)) return false;
        const msLeft = new Date(t.deadline).getTime() - Date.now();
        return msLeft > 0 && msLeft <= 60 * 60 * 1000;
      });

      for (const t of toNotify) {
        sendNotification('마감 1시간 전', `"${t.title}" 마감이 1시간 이내로 다가왔습니다.`);
        notifiedRef.current.add(t.id);
        await taskRepository.update(t.id, { notified: true });
      }

      // 반복 작업: 완료된 반복 작업 → 다음 일정 자동 생성
      for (const t of all) {
        if (t.status === 'done' && t.repeat) {
          const nextDeadline = calcNextDeadline(t.deadline, t.repeat);
          if (nextDeadline) {
            await taskRepository.create({
              title: t.title,
              notes: t.notes,
              category: t.category,
              deadline: nextDeadline,
              status: 'todo',
              priority: t.priority,
              tags: t.tags,
              subtasks: t.subtasks.map((s) => ({ ...s, done: false, id: uuid() })),
            });
            // 반복 규칙 제거 (이미 생성함)
            await taskRepository.update(t.id, { repeat: undefined });
          }
        }
      }

      setTasks(await taskRepository.getAll());
    };

    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // 검색 + 필터 + 정렬
  const displayedTasks = useMemo(() => {
    let list = tasks;
    if (filter !== 'all')
      list = list.filter((t) => t.status === filter);
    if (categoryFilter !== 'all')
      list = list.filter((t) => t.category === categoryFilter);
    if (tagFilter)
      list = list.filter((t) => t.tags.includes(tagFilter));
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) ||
               t.notes?.toLowerCase().includes(q) ||
               t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return sortTasks(list);
  }, [tasks, filter, categoryFilter, searchQuery, tagFilter]);

  // 통계
  const stats = useMemo(() => {
    const total    = tasks.length;
    const done     = tasks.filter((t) => t.status === 'done').length;
    const overdue  = tasks.filter((t) => t.status !== 'done' && new Date(t.deadline) < new Date()).length;
    const critical = tasks.filter((t) => {
      if (t.status === 'done') return false;
      const ms = new Date(t.deadline).getTime() - Date.now();
      return ms > 0 && ms <= 3 * 3600000;
    }).length;
    return { total, done, overdue, critical };
  }, [tasks]);

  // 모든 태그 목록
  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [tasks]);

  const unsyncedCount = useMemo(() => tasks.filter((t) => !t.isSynced).length, [tasks]);

  const addTask = useCallback(
    async (data: {
      title: string;
      notes?: string;
      category: TaskCategory;
      deadline: string;
      status: TaskStatus;
      priority?: Priority;
      tags?: string[];
      subtasks?: Subtask[];
      repeat?: RepeatRule;
    }) => {
      const task = await taskRepository.create(data);
      setTasks((prev) => [...prev, task]);
    }, []
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      const all = await taskRepository.getAll();
      const task = all.find((t) => t.id === id);
      const enriched = { ...patch };

      // completedAt 자동 처리
      if (patch.status === 'done' && task?.status !== 'done') {
        enriched.completedAt = new Date().toISOString();
      } else if (patch.status && patch.status !== 'done' && task?.status === 'done') {
        enriched.completedAt = undefined;
      }

      // 서브태스크 → 진행률 자동 계산
      if (patch.subtasks && patch.subtasks.length > 0) {
        enriched.progress = Math.round(
          (patch.subtasks.filter((s) => s.done).length / patch.subtasks.length) * 100
        );
      }

      const updated = await taskRepository.update(id, enriched);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }, []
  );

  const deleteTask = useCallback(async (id: string) => {
    await taskRepository.softDelete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const deleteDoneTasks = useCallback(async () => {
    const all = await taskRepository.getAll();
    const done = all.filter((t) => t.status === 'done');
    await Promise.all(done.map((t) => taskRepository.softDelete(t.id)));
    setTasks((prev) => prev.filter((t) => t.status !== 'done'));
  }, []);

  const duplicateTask = useCallback(async (id: string) => {
    const all = await taskRepository.getAll();
    const source = all.find((t) => t.id === id);
    if (!source) return;
    const task = await taskRepository.create({
      title: `${source.title} (복사)`,
      notes: source.notes,
      category: source.category,
      deadline: source.deadline,
      status: 'todo',
      priority: source.priority,
      tags: [...source.tags],
      subtasks: source.subtasks.map((s) => ({ ...s, id: uuid(), done: false })),
    });
    setTasks((prev) => [...prev, task]);
  }, []);

  // 시간 추적
  const startTimeTracking = useCallback(async (id: string) => {
    const all = await taskRepository.getAll();
    const task = all.find((t) => t.id === id);
    if (!task) return;
    const sessions = [...task.timeSessions, { start: new Date().toISOString() }];
    const updated = await taskRepository.update(id, { timeSessions: sessions });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const stopTimeTracking = useCallback(async (id: string) => {
    const all = await taskRepository.getAll();
    const task = all.find((t) => t.id === id);
    if (!task) return;
    const sessions = task.timeSessions.map((s, i) =>
      i === task.timeSessions.length - 1 && !s.end
        ? { ...s, end: new Date().toISOString() }
        : s
    );
    const updated = await taskRepository.update(id, { timeSessions: sessions });
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  // 드래그 정렬
  const reorderTasks = useCallback(async (orderedIds: string[]) => {
    const all = await taskRepository.getAll();
    for (let i = 0; i < orderedIds.length; i++) {
      const task = all.find((t) => t.id === orderedIds[i]);
      if (task && task.sortOrder !== i) {
        await taskRepository.update(orderedIds[i], { sortOrder: i, isSynced: task.isSynced });
      }
    }
    setTasks(await taskRepository.getAll());
  }, []);

  // 휴지통
  const getTrash = useCallback(async () => {
    return taskRepository.getTrash();
  }, []);

  const restoreTask = useCallback(async (id: string) => {
    const restored = await taskRepository.restore(id);
    setTasks((prev) => [...prev, restored]);
  }, []);

  const emptyTrash = useCallback(async () => {
    await taskRepository.emptyTrash();
  }, []);

  const exportJSON = useCallback(async () => {
    const json = await taskRepository.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `tasks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const importJSON = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      await taskRepository.importJSON(text);
      setTasks(await taskRepository.getAll());
    } catch (e) {
      alert(e instanceof Error ? e.message : '파일을 불러올 수 없습니다.');
    }
  }, []);

  const syncToServer = useCallback(async (apiUrl: string) => {
    const all = await taskRepository.getAll();
    const unsynced = all.filter((t) => !t.isSynced);
    if (unsynced.length === 0) return;
    await Promise.all(
      unsynced.map((t) =>
        fetch(apiUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(t),
        }).then((res) => { if (!res.ok) throw new Error(`Failed: ${t.id}`); })
      )
    );
    await Promise.all(unsynced.map((t) => taskRepository.update(t.id, { isSynced: true })));
    setTasks(await taskRepository.getAll());
  }, []);

  return {
    tasks: displayedTasks,
    allTasks: tasks,
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
  };
}

function calcNextDeadline(currentDeadline: string, rule: RepeatRule): string | null {
  const d = new Date(currentDeadline);
  switch (rule.type) {
    case 'daily':
      d.setDate(d.getDate() + rule.interval);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7 * rule.interval);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + rule.interval);
      break;
    default:
      return null;
  }
  return d.toISOString();
}
