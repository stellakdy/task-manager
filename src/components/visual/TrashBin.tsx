'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { Task } from '@/core/ports/taskRepository';
import { CATEGORY_STYLES } from '@/utils/categories';
import { t } from '@/utils/i18n';
import type { Locale } from '@/utils/i18n';

interface Props {
  getTrash: () => Promise<Task[]>;
  onRestore: (id: string) => Promise<void>;
  onEmpty: () => Promise<void>;
  locale: Locale;
}

function daysLeft(deletedAt: string): number {
  const del = new Date(deletedAt).getTime();
  const ttl = 7 * 24 * 60 * 60 * 1000;
  const remaining = ttl - (Date.now() - del);
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

export default function TrashBin({ getTrash, onRestore, onEmpty, locale }: Props) {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrash().then((trashItems) => { setItems(trashItems); setLoading(false); });
  }, [getTrash]);

  async function handleRestore(id: string) {
    await onRestore(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleEmpty() {
    if (!confirm(t('emptyTrashConfirm', locale))) return;
    await onEmpty();
    setItems([]);
  }

  if (loading) {
    return <div className="py-10 text-center text-sm text-gray-400 dark:text-slate-500">{t('loading', locale)}</div>;
  }

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {t('trashItems', locale, { n: items.length })}
          </span>
          <button onClick={handleEmpty}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium">
            <Trash2 size={12} /> {t('emptyTrash', locale)}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-10 text-center">
          <p className="text-sm text-gray-400 dark:text-slate-500">{t('trashEmpty', locale)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const cs = CATEGORY_STYLES[item.category ?? '기타'];
            const days = daysLeft(item.deletedAt!);

            return (
              <div key={item.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 opacity-70 hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cs.dot }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 truncate line-through">{item.title}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">{t('daysUntilDelete', locale, { n: days })}</p>
                </div>
                <button onClick={() => handleRestore(item.id)}
                  className="flex items-center gap-1 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 shrink-0 transition-colors">
                  <RotateCcw size={12} /> {t('restore', locale)}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
