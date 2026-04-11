/**
 * Remote adapter stub — replace this with actual Supabase/PostgreSQL calls.
 * Swap `taskRepository` import in useTasks.ts from localAdapter to remoteAdapter
 * when you're ready to go server-side. No UI code changes required.
 */
import type { ITaskRepository, Task, TaskStatus } from '@/core/ports/taskRepository';
import type { TaskCategory } from '@/utils/categories';

export class RemoteAdapter implements ITaskRepository {
  constructor(private apiBase: string) {}

  async getAll(): Promise<Task[]> {
    const res = await fetch(`${this.apiBase}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  }

  async create(data: { title: string; notes?: string; category: TaskCategory; deadline: string; status: TaskStatus }): Promise<Task> {
    const res = await fetch(`${this.apiBase}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  }

  async update(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    const res = await fetch(`${this.apiBase}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
  }

  async exportJSON(): Promise<string> {
    const tasks = await this.getAll();
    return JSON.stringify(tasks, null, 2);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async importJSON(_json: string): Promise<void> {
    throw new Error('Bulk import not yet implemented for remote adapter');
  }
}
