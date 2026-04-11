'use client';

import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import type { Subtask } from '@/core/ports/taskRepository';
import { v4 as uuid } from 'uuid';
import { t } from '@/utils/i18n';
import type { Locale } from '@/utils/i18n';

interface Props {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
  readonly?: boolean;
  locale?: Locale;
}

export default function SubtaskList({ subtasks, onChange, readonly, locale = 'ko' }: Props) {
  const [newTitle, setNewTitle] = useState('');

  function addSubtask() {
    if (!newTitle.trim()) return;
    onChange([...subtasks, { id: uuid(), title: newTitle.trim(), done: false }]);
    setNewTitle('');
  }

  function toggleSubtask(id: string) {
    if (readonly) return;
    onChange(subtasks.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  }

  function removeSubtask(id: string) {
    onChange(subtasks.filter((s) => s.id !== id));
  }

  const doneCount = subtasks.filter((s) => s.done).length;

  return (
    <div className="space-y-1.5">
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-300"
              style={{ width: `${subtasks.length ? (doneCount / subtasks.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">
            {doneCount}/{subtasks.length}
          </span>
        </div>
      )}

      {subtasks.map((s) => (
        <div key={s.id} className="flex items-center gap-1.5 group">
          <button
            onClick={() => toggleSubtask(s.id)}
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
              s.done
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 dark:border-slate-500 hover:border-green-400'
            }`}
          >
            {s.done && <Check size={10} />}
          </button>
          <span className={`flex-1 text-xs ${s.done ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-700 dark:text-slate-300'}`}>
            {s.title}
          </span>
          {!readonly && (
            <button onClick={() => removeSubtask(s.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all">
              <X size={12} />
            </button>
          )}
        </div>
      ))}

      {!readonly && (
        <div className="flex gap-1.5 mt-1">
          <input
            type="text"
            placeholder={t('addSubtask', locale)}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
            className="flex-1 rounded border border-gray-200 dark:border-slate-600 bg-transparent px-2 py-0.5 text-xs text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button onClick={addSubtask}
            className="rounded bg-gray-100 dark:bg-slate-600 p-1 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-500">
            <Plus size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
