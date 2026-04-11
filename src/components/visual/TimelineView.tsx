'use client';

import { useMemo } from 'react';
import type { Task } from '@/core/ports/taskRepository';
import { CATEGORY_STYLES } from '@/utils/categories';
import { formatTimeLeft } from '@/utils/time';
import { t } from '@/utils/i18n';
import type { Locale } from '@/utils/i18n';

interface Props {
  tasks: Task[];
  locale: Locale;
}

function dayLabel(d: Date, locale: Locale): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return t('today', locale);
  if (d.toDateString() === tomorrow.toDateString()) return t('tomorrow', locale);

  const daysStr = t('calDays', locale);
  const days = daysStr.split(',');
  const dow = days[d.getDay()] ?? '';
  return `${d.getMonth() + 1}/${d.getDate()} (${dow})`;
}

function timeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface DayGroup {
  label: string;
  date: Date;
  tasks: Task[];
}

export default function TimelineView({ tasks, locale }: Props) {
  const groups = useMemo(() => {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 미완료 + 이번주 내 마감 (기한초과 포함)
    const relevant = tasks
      .filter((t) => t.status !== 'done')
      .filter((t) => new Date(t.deadline) <= weekLater)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    const map = new Map<string, DayGroup>();
    for (const t of relevant) {
      const d = new Date(t.deadline);
      const key = d.toDateString();
      if (!map.has(key)) {
        map.set(key, { label: dayLabel(d, locale), date: d, tasks: [] });
      }
      map.get(key)!.tasks.push(t);
    }
    return Array.from(map.values());
  }, [tasks, locale]);

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-10 text-center">
        <p className="text-sm text-gray-400 dark:text-slate-500">{t('noTimelineTasks', locale)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groups.map((group) => {
        const isOverdue = group.date < new Date() && group.date.toDateString() !== new Date().toDateString();

        return (
          <div key={group.label} className="relative pl-6">
            {/* 타임라인 선 */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-700" />

            {/* 날짜 노드 */}
            <div className="absolute left-0 top-2.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 bg-gray-300 dark:bg-slate-600 z-10"
              style={{ backgroundColor: isOverdue ? '#EF4444' : undefined }}
            />

            {/* 날짜 헤더 */}
            <div className="pt-1.5 pb-1">
              <span className={`text-xs font-bold ${
                isOverdue ? 'text-red-600 dark:text-red-400' :
                group.label === t('today', locale) ? 'text-blue-600 dark:text-blue-400' :
                'text-gray-600 dark:text-slate-400'
              }`}>
                {group.label}
              </span>
            </div>

            {/* 작업들 */}
            <div className="space-y-1.5 pb-3">
              {group.tasks.map((task) => {
                const dl = new Date(task.deadline);
                const overdue = dl < new Date();
                const cs = CATEGORY_STYLES[task.category ?? '기타'];
                const progress = task.subtasks.length > 0
                  ? Math.round((task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100)
                  : task.progress;

                return (
                  <div key={task.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                      overdue
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}>
                    {/* 시간 */}
                    <span className={`text-xs font-mono shrink-0 w-12 ${
                      overdue ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-slate-400'
                    }`}>
                      {timeStr(dl)}
                    </span>

                    {/* 카테고리 점 */}
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cs.dot }} />

                    {/* 제목 */}
                    <span className="flex-1 text-xs font-medium text-gray-800 dark:text-slate-200 truncate">
                      {task.title}
                    </span>

                    {/* 진행률 바 */}
                    {progress > 0 && (
                      <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    )}

                    {/* 남은 시간 */}
                    <span className={`text-[10px] font-medium shrink-0 ${
                      overdue ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'
                    }`}>
                      {formatTimeLeft(task.deadline, locale)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
