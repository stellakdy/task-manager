import { v4 as uuid } from 'uuid';
import type { ITaskRepository, Task, TaskStatus, Priority, Subtask, RepeatRule } from '@/core/ports/taskRepository';
import type { TaskCategory } from '@/utils/categories';

const STORAGE_KEY = 'task-manager-v1';
const TRASH_KEY   = 'task-manager-trash';
const TRASH_TTL   = 7 * 24 * 60 * 60 * 1000; // 7일

function readStorage(): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Partial<Task>[];
    return raw.map((t) => ({
      id:           t.id ?? uuid(),
      title:        t.title ?? '',
      notes:        t.notes ?? '',
      category:     t.category ?? '기타',
      deadline:     t.deadline ?? new Date().toISOString(),
      status:       t.status ?? 'todo',
      lastModified: t.lastModified ?? new Date().toISOString(),
      isSynced:     t.isSynced ?? false,
      createdAt:    t.createdAt ?? t.lastModified ?? new Date().toISOString(),
      notified:     t.notified ?? false,
      completedAt:  t.completedAt,
      // 신규 필드 기본값
      pinned:       t.pinned ?? false,
      priority:     t.priority ?? 'normal',
      subtasks:     t.subtasks ?? [],
      tags:         t.tags ?? [],
      progress:     t.progress ?? 0,
      sortOrder:    t.sortOrder ?? 0,
      deletedAt:    t.deletedAt,
      repeat:       t.repeat,
      timeSessions: t.timeSessions ?? [],
      links:        t.links ?? [],
    }));
  } catch {
    return [];
  }
}

function readTrash(): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(TRASH_KEY) ?? '[]') as Task[];
    const now = Date.now();
    // 7일 지난 항목 자동 제거
    return raw.filter((t) => t.deletedAt && now - new Date(t.deletedAt).getTime() < TRASH_TTL);
  } catch {
    return [];
  }
}

function writeStorage(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function writeTrash(tasks: Task[]): void {
  localStorage.setItem(TRASH_KEY, JSON.stringify(tasks));
}

function mergeByLastModified(existing: Task[], incoming: Task[]): Task[] {
  const map = new Map<string, Task>();
  for (const t of existing) map.set(t.id, t);
  for (const t of incoming) {
    const cur = map.get(t.id);
    if (!cur || new Date(t.lastModified) > new Date(cur.lastModified)) {
      map.set(t.id, t);
    }
  }
  return Array.from(map.values());
}

class LocalAdapter implements ITaskRepository {
  async getAll(): Promise<Task[]> {
    return readStorage();
  }

  async create(data: {
    title: string;
    notes?: string;
    category: TaskCategory;
    deadline: string;
    status: TaskStatus;
    priority?: Priority;
    tags?: string[];
    subtasks?: Subtask[];
    repeat?: RepeatRule;
  }): Promise<Task> {
    const now = new Date().toISOString();
    const all = readStorage();
    const maxOrder = all.reduce((m, t) => Math.max(m, t.sortOrder), 0);
    const task: Task = {
      notes:        '',
      pinned:       false,
      priority:     'normal',
      subtasks:     [],
      tags:         [],
      progress:     0,
      timeSessions: [],
      links:        [],
      ...data,
      id:           uuid(),
      lastModified: now,
      createdAt:    now,
      isSynced:     false,
      notified:     false,
      sortOrder:    maxOrder + 1,
    };
    writeStorage([...all, task]);
    return task;
  }

  async update(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    const tasks = readStorage();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Task ${id} not found`);
    const updated: Task = {
      ...tasks[idx],
      ...patch,
      id,
      createdAt:    tasks[idx].createdAt,
      lastModified: new Date().toISOString(),
      isSynced:     patch.isSynced ?? false,
    };
    tasks[idx] = updated;
    writeStorage(tasks);
    return updated;
  }

  async delete(id: string): Promise<void> {
    writeStorage(readStorage().filter((t) => t.id !== id));
  }

  // ── 휴지통 ──
  async softDelete(id: string): Promise<void> {
    const tasks = readStorage();
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    target.deletedAt = new Date().toISOString();
    writeStorage(tasks.filter((t) => t.id !== id));
    const trash = readTrash();
    trash.push(target);
    writeTrash(trash);
  }

  async getTrash(): Promise<Task[]> {
    return readTrash();
  }

  async restore(id: string): Promise<Task> {
    const trash = readTrash();
    const target = trash.find((t) => t.id === id);
    if (!target) throw new Error(`Trash item ${id} not found`);
    delete target.deletedAt;
    const tasks = readStorage();
    tasks.push(target);
    writeStorage(tasks);
    writeTrash(trash.filter((t) => t.id !== id));
    return target;
  }

  async emptyTrash(): Promise<void> {
    writeTrash([]);
  }

  async exportJSON(): Promise<string> {
    return JSON.stringify(readStorage(), null, 2);
  }

  async importJSON(json: string): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('유효하지 않은 JSON 파일입니다.');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('JSON 파일이 배열 형식이 아닙니다.');
    }
    const incoming: Task[] = parsed.filter(
      (item: Record<string, unknown>) => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.deadline === 'string'
    ) as Task[];
    if (incoming.length === 0) {
      throw new Error('가져올 수 있는 할 일이 없습니다.');
    }
    const merged = mergeByLastModified(readStorage(), incoming);
    writeStorage(merged);
  }
}

export const taskRepository: ITaskRepository = new LocalAdapter();
