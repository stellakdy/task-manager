'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '@/core/ports/taskRepository';
import { CATEGORY_STYLES } from '@/utils/categories';
import { t } from '@/utils/i18n';
import type { Locale } from '@/utils/i18n';

interface Props {
  tasks: Task[];
  locale: Locale;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarView({ tasks, locale }: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { year, month } = cursor;
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = () => setCursor((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCursor((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });
  const goToday = () => { const d = new Date(); setCursor({ year: d.getFullYear(), month: d.getMonth() }); };

  // i18n 요일 / 월 이름
  const dayLabels = t('calDays', locale).split(',');
  const monthNames = t('calMonths', locale).split(',');

  const dayMap = useMemo(() => {
    const map = new Map<number, Task[]>();
    tasks.forEach((tk) => {
      const d = new Date(tk.deadline);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(tk);
      }
    });
    return map;
  }, [tasks, year, month]);

  const todayDate = new Date();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // 헤더 텍스트
  const headerText = locale === 'en'
    ? `${monthNames[month]} ${year}`
    : locale === 'ja'
      ? `${year}年 ${monthNames[month]}`
      : `${year}년 ${month + 1}월`;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><ChevronLeft size={16} className="text-gray-500 dark:text-slate-400" /></button>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">{headerText}</h3>
          <button onClick={goToday} className="text-[10px] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 underline">{t('calToday', locale)}</button>
        </div>
        <button onClick={next} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><ChevronRight size={16} className="text-gray-500 dark:text-slate-400" /></button>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className={`text-center text-[10px] font-medium py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400 dark:text-slate-500'}`}>{d}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="min-h-[72px] bg-gray-50 dark:bg-slate-800/50" />;
          const dateTasks = dayMap.get(day) ?? [];
          const isToday = sameDay(new Date(year, month, day), todayDate);
          const dow = (startDow + day - 1) % 7;

          return (
            <div key={i} className={`min-h-[72px] p-1 bg-white dark:bg-slate-800 relative group ${
              isToday ? 'ring-2 ring-inset ring-blue-400 dark:ring-blue-500' : ''
            }`}>
              {/* 날짜 숫자 */}
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[11px] font-medium leading-none ${
                  isToday ? 'bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center' :
                  dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-600 dark:text-slate-400'
                }`}>
                  {day}
                </span>
                {dateTasks.length > 3 && (
                  <span className="text-[8px] text-gray-400 dark:text-slate-500">+{dateTasks.length - 3}</span>
                )}
              </div>

              {/* 작업 목록 (최대로 보이지 않고 점으로만) */}
              <div className="flex flex-wrap gap-1 mt-1 px-1">
                {dateTasks.slice(0, 5).map((tk) => {
                  const cs = CATEGORY_STYLES[tk.category ?? '기타'];
                  const isDone = tk.status === 'done';
                  return (
                    <div key={tk.id}
                      className={`w-1.5 h-1.5 rounded-full ${isDone ? 'opacity-30' : ''}`}
                      style={{ backgroundColor: cs.dot }}
                      title={`${tk.title} - ${new Date(tk.deadline).toLocaleTimeString(locale === 'en' ? 'en' : locale === 'ja' ? 'ja' : 'ko', { hour: '2-digit', minute: '2-digit' })}`}
                    />
                  );
                })}
                {dateTasks.length > 5 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600" title={`+${dateTasks.length - 5} more`} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
