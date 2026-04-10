'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { taskRepository } from '@/core/adapters/localAdapter';
import type { Task, TaskStatus } from '@/core/ports/taskRepository';
import type { TaskCategory } from '@/utils/categories';
import { urgencyWeight } from '@/utils/time';

export type FilterStatus   = 'all' | TaskStatus;
export type FilterCategory = 'all' | TaskCategory;

function sortByUrgency(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const wa = urgencyWeight(a.deadline);
    const wb = urgencyWeight(b.deadline);
    if (wa !== wb) return wa - wb;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

function sendNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/favicon.ico' });
}

export function useTasks() {
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [filter, setFilter]             = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const notifiedRef = useRef<Set<string>>(new Set());

  // 마운트 시 로드
  useEffect(() => {
    taskRepository.getAll().then((loaded) => {
      setTasks(loaded);
      loaded.filter((t) => t.notified).forEach((t) => notifiedRef.current.add(t.id));
    });
  }, []);

  // 1분 ticker + 브라우저 알림 체크
  useEffect(() => {
    const tick = async () => {
      const all = await taskRepository.getAll();

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

      setTasks([...all]);
    };

    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // 검색 + 상태필터 + 카테고리필터 + 정렬
  const displayedTasks = useMemo(() => {
    let list = tasks;
    if (filter !== 'all')
      list = list.filter((t) => t.status === filter);
    if (categoryFilter !== 'all')
      list = list.filter((t) => t.category === categoryFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q)
      );
    }
    return sortByUrgency(list);
  }, [tasks, filter, categoryFilter, searchQuery]);

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

  const unsyncedCount = useMemo(() => tasks.filter((t) => !t.isSynced).length, [tasks]);

  const addTask = useCallback(
    async (data: { title: string; notes?: string; category: TaskCategory; deadline: string; status: TaskStatus }) => {
      const task = await taskRepository.create(data);
      setTasks((prev) => [...prev, task]);
    }, []
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      // completedAt 자동 처리
      const task = tasks.find((t) => t.id === id);
      const enriched = { ...patch };
      if (patch.status === 'done' && task?.status !== 'done') {
        enriched.completedAt = new Date().toISOString();
      } else if (patch.status && patch.status !== 'done' && task?.status === 'done') {
        enriched.completedAt = undefined;
      }

      const updated = await taskRepository.update(id, enriched);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }, [tasks]
  );

  const deleteTask = useCallback(async (id: string) => {
    await taskRepository.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const deleteDoneTasks = useCallback(async () => {
    const done = tasks.filter((t) => t.status === 'done');
    await Promise.all(done.map((t) => taskRepository.delete(t.id)));
    setTasks((prev) => prev.filter((t) => t.status !== 'done'));
  }, [tasks]);

  const exportJSON = useCallback(async () => {
    const json = await taskRepository.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `tasks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importJSON = useCallback(async (file: File) => {
    const text = await file.text();
    await taskRepository.importJSON(text);
    setTasks(await taskRepository.getAll());
  }, []);

  const syncToServer = useCallback(async (apiUrl: string) => {
    const unsynced = tasks.filter((t) => !t.isSynced);
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
  }, [tasks]);

  return {
    tasks: displayedTasks,
    allTasks: tasks,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    stats,
    unsyncedCount,
    addTask,
    updateTask,
    deleteTask,
    deleteDoneTasks,
    exportJSON,
    importJSON,
    syncToServer,
  };
}
