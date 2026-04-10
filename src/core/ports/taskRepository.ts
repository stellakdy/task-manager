import type { TaskCategory } from '@/utils/categories';

export type { TaskCategory };
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  notes: string;
  category: TaskCategory;
  deadline: string;     // ISO 8601
  status: TaskStatus;
  lastModified: string; // ISO 8601 — sync 충돌 해결용
  isSynced: boolean;
  createdAt: string;    // ISO 8601 — 게이지 계산용
  notified: boolean;    // 브라우저 알림 발송 여부
  completedAt?: string; // ISO 8601 — 잔디용 완료 시각
}

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  create(data: {
    title: string;
    notes?: string;
    category: TaskCategory;
    deadline: string;
    status: TaskStatus;
  }): Promise<Task>;
  update(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task>;
  delete(id: string): Promise<void>;
  exportJSON(): Promise<string>;
  importJSON(json: string): Promise<void>;
}
