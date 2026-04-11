'use client';

import { useState, useMemo } from 'react';
import type { Task } from '@/core/ports/taskRepository';
import { CATEGORIES, CATEGORY_STYLES } from '@/utils/categories';
import type { TaskCategory } from '@/utils/categories';
import { t } from '@/utils/i18n';
import type { Locale } from '@/utils/i18n';

interface Props {
  tasks: Task[];
  locale: Locale;
}

type Period = 'week' | 'month';

function getWeekRange(): [Date, Date] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // 이번 주 일요일
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return [start, end];
}

function getMonthRange(): [Date, Date] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return [start, end];
}

function formatDuration(ms: number, locale: Locale): string {
  if (ms === 0) return t('rptNone', locale);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return t('rptDurH', locale, { h, m });
  return t('rptDurM', locale, { m });
}

function formatDateRange(start: Date, end: Date): string {
  const last = new Date(end.getTime() - 86400000); // end - 1 day
  return `${start.getMonth() + 1}/${start.getDate()} ~ ${last.getMonth() + 1}/${last.getDate()}`;
}

export default function WeeklyReport({ tasks, locale }: Props) {
  const [period, setPeriod] = useState<Period>('week');

  const report = useMemo(() => {
    const [start, end] = period === 'week' ? getWeekRange() : getMonthRange();

    // 해당 기간 내 완료된 작업
    const completed = tasks.filter((t) => {
      if (!t.completedAt) return false;
      const d = new Date(t.completedAt);
      return d >= start && d < end;
    });

    // 해당 기간 내 생성된 작업
    const created = tasks.filter((t) => {
      const d = new Date(t.createdAt);
      return d >= start && d < end;
    });

    // 카테고리별 완료 수
    const byCategory = CATEGORIES.reduce((acc, cat) => {
      acc[cat] = completed.filter((t) => t.category === cat).length;
      return acc;
    }, {} as Record<TaskCategory, number>);

    // 총 작업 시간
    const totalTimeMs = tasks.reduce((sum, t) => {
      const sessionTime = (t.timeSessions ?? []).reduce((s, sess) => {
        const st = new Date(sess.start).getTime();
        const en = sess.end ? new Date(sess.end).getTime() : 0;
        if (en && st >= start.getTime() && st < end.getTime()) {
          return s + (en - st);
        }
        return s;
      }, 0);
      return sum + sessionTime;
    }, 0);

    // 현재 진행 중
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;

    // 기한 초과
    const overdue = tasks.filter((t) => t.status !== 'done' && new Date(t.deadline) < new Date()).length;

    // 완료율
    const rate = created.length > 0 ? Math.round((completed.length / created.length) * 100) : 0;

    return {
      completed: completed.length,
      created: created.length,
      byCategory,
      totalTimeMs,
      inProgress,
      overdue,
      rate,
      start,
      end,
    };
  }, [tasks, period]);

  const maxCat = Math.max(...Object.values(report.byCategory), 1);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm space-y-4">
      {/* 탭 */}
      <div className="flex items-center gap-2">
        <button onClick={() => setPeriod('week')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            period === 'week' ? 'bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
          }`}>
          {t('thisWeek', locale)}
        </button>
        <button onClick={() => setPeriod('month')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            period === 'month' ? 'bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
          }`}>
          {t('thisMonth', locale)}
        </button>
        <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-auto">
          {formatDateRange(report.start, report.end)}
        </span>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: t('completed', locale), value: report.completed, color: 'text-green-600 dark:text-green-400' },
          { label: t('created', locale), value: report.created, color: 'text-blue-600 dark:text-blue-400' },
          { label: t('rptInProgress', locale), value: report.inProgress, color: 'text-yellow-600 dark:text-yellow-400' },
          { label: t('rptOverdue', locale), value: report.overdue, color: 'text-red-600 dark:text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <div className={`text-lg font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-gray-500 dark:text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* 완료율 바 */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-500 dark:text-slate-400 mb-1">
          <span>{t('rptRate', locale)}</span>
          <span>{report.rate}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-500" style={{ width: `${report.rate}%` }} />
        </div>
      </div>

      {/* 카테고리별 차트 */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-medium text-gray-500 dark:text-slate-400">{t('byCategory', locale)}</span>
        {CATEGORIES.map((cat) => {
          const count = report.byCategory[cat];
          const cs = CATEGORY_STYLES[cat];
          return (
            <div key={cat} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 dark:text-slate-400 w-8 shrink-0">{cat}</span>
              <div className="flex-1 h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(count / maxCat) * 100}%`, backgroundColor: cs.dot }}
                />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 w-5 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {/* 총 작업 시간 */}
      {report.totalTimeMs > 0 && (
        <div className="text-center pt-2 border-t border-gray-100 dark:border-slate-700">
          <div className="text-xs text-gray-500 dark:text-slate-400">{t('totalWorkTime', locale)}</div>
          <div className="text-sm font-bold text-gray-800 dark:text-slate-200">{formatDuration(report.totalTimeMs, locale)}</div>
        </div>
      )}
    </div>
  );
}
