import type { TaskCategory } from '@/utils/categories';

export type { TaskCategory };
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type Priority = 'high' | 'normal' | 'low';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface TimeSession {
  start: string;  // ISO 8601
  end?: string;   // ISO 8601
}

export interface RepeatRule {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;    // 매 N일/주/월
  nextDue?: string;    // 다음 생성 예정일 ISO
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  category: TaskCategory;
  deadline: string;       // ISO 8601
  status: TaskStatus;
  lastModified: string;   // ISO 8601 — sync 충돌 해결용
  isSynced: boolean;
  createdAt: string;      // ISO 8601 — 게이지 계산용
  notified: boolean;      // 브라우저 알림 발송 여부
  completedAt?: string;   // ISO 8601 — 잔디용 완료 시각

  // ── 신규 필드 ──
  pinned: boolean;
  priority: Priority;
  subtasks: Subtask[];
  tags: string[];
  progress: number;        // 0-100
  sortOrder: number;
  deletedAt?: string;      // soft delete — ISO 8601
  repeat?: RepeatRule;
  timeSessions: TimeSession[];
}

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  create(data: {
    title: string;
    notes?: string;
    category: TaskCategory;
    deadline: string;
    status: TaskStatus;
    priority?: Priority;
    tags?: string[];
    subtasks?: Subtask[];
    repeat?: RepeatRule;
  }): Promise<Task>;
  update(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task>;
  delete(id: string): Promise<void>;
  exportJSON(): Promise<string>;
  importJSON(json: string): Promise<void>;
  // 휴지통
  softDelete(id: string): Promise<void>;
  getTrash(): Promise<Task[]>;
  restore(id: string): Promise<Task>;
  emptyTrash(): Promise<void>;
}
