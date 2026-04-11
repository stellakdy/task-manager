'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Task } from '@/core/ports/taskRepository';
import { CATEGORY_STYLES } from '@/utils/categories';
import { t } from '@/utils/i18n';
import type { Locale } from '@/utils/i18n';

interface Props {
  tasks: Task[];
  locale: Locale;
}

export default function TodayWidget({ tasks, locale }: Props) {
  const { todayTasks, overdueTasks } = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const todayTasks = tasks.filter((task) => {
      if (task.status === 'done') return false;
      const dl = new Date(task.deadline);
      return dl >= todayStart && dl <= todayEnd;
    }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const overdueTasks = tasks.filter((task) => {
      if (task.status === 'done') return false;
      return new Date(task.deadline) < now;
    });

    return { todayTasks, overdueTasks };
  }, [tasks]);

  if (todayTasks.length === 0 && overdueTasks.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm">
      <div className="flex items-center gap-3">
        {/* 기한 초과 */}
        {overdueTasks.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-1.5">
            <AlertTriangle size={14} className="text-red-500" />
            <div>
              <div className="text-xs font-bold text-red-600 dark:text-red-400">{t('todayOverdue', locale)}</div>
              <div className="text-[10px] text-red-500 dark:text-red-400">{t('todayItems', locale, { n: overdueTasks.length })}</div>
            </div>
          </div>
        )}

        {/* 오늘 마감 */}
        {todayTasks.length > 0 && (
          <div className="flex-1">
            <div className="text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
              {t('todayWidget', locale)} · {t('todayItems', locale, { n: todayTasks.length })}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {todayTasks.map((task) => {
                const cs = CATEGORY_STYLES[task.category ?? '기타'];
                const dl = new Date(task.deadline);
                const time = `${String(dl.getHours()).padStart(2, '0')}:${String(dl.getMinutes()).padStart(2, '0')}`;
                return (
                  <div key={task.id}
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border"
                    style={{
                      backgroundColor: `${cs.dot}12`,
                      borderColor: `${cs.dot}30`,
                      color: cs.dot,
                    }}>
                    <span className="font-mono">{time}</span>
                    <span className="truncate max-w-[100px]">{task.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
