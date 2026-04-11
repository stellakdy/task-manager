'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '@/core/ports/taskRepository';
import { CATEGORY_STYLES } from '@/utils/categories';

interface Props {
  tasks: Task[];
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarView({ tasks }: Props) {
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
  const today = () => { const d = new Date(); setCursor({ year: d.getFullYear(), month: d.getMonth() }); };

  // 해당 월의 마감 작업을 날짜별로 그룹핑
  const dayMap = useMemo(() => {
    const map = new Map<number, Task[]>();
    tasks.forEach((t) => {
      const d = new Date(t.deadline);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(t);
      }
    });
    return map;
  }, [tasks, year, month]);

  const todayDate = new Date();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><ChevronLeft size={16} className="text-gray-500 dark:text-slate-400" /></button>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">{year}년 {month + 1}월</h3>
          <button onClick={today} className="text-[10px] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 underline">오늘</button>
        </div>
        <button onClick={next} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><ChevronRight size={16} className="text-gray-500 dark:text-slate-400" /></button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 dark:text-slate-500 py-1">{d}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="aspect-square" />;
          const dateTasks = dayMap.get(day) ?? [];
          const isToday = sameDay(new Date(year, month, day), todayDate);
          const hasDone = dateTasks.some((t) => t.status === 'done');
          const hasOverdue = dateTasks.some((t) => t.status !== 'done' && new Date(t.deadline) < new Date());

          return (
            <div key={i} className={`aspect-square rounded-lg p-0.5 flex flex-col items-center justify-start relative group cursor-default transition-colors ${
              isToday ? 'bg-blue-50 dark:bg-blue-950 ring-1 ring-blue-300 dark:ring-blue-700' : 'hover:bg-gray-50 dark:hover:bg-slate-750'
            }`}>
              <span className={`text-[11px] font-medium ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-slate-400'}`}>
                {day}
              </span>
              {/* 작업 도트 */}
              {dateTasks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dateTasks.slice(0, 3).map((t) => {
                    const cs = CATEGORY_STYLES[t.category ?? '기타'];
                    return (
                      <div key={t.id}
                        className={`w-1.5 h-1.5 rounded-full ${t.status === 'done' ? 'opacity-40' : ''}`}
                        style={{ backgroundColor: cs.dot }}
                        title={t.title}
                      />
                    );
                  })}
                  {dateTasks.length > 3 && (
                    <span className="text-[8px] text-gray-400 dark:text-slate-500">+{dateTasks.length - 3}</span>
                  )}
                </div>
              )}
              {/* 상태 인디케이터 */}
              {hasOverdue && <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-red-500" />}
              {hasDone && !hasOverdue && <div className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-green-500" />}

              {/* 호버 툴팁 */}
              {dateTasks.length > 0 && (
                <div className="absolute z-30 hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-1 w-44 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-lg p-2">
                  {dateTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-1.5 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_STYLES[t.category ?? '기타'].dot }} />
                      <span className={`text-[10px] truncate ${t.status === 'done' ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-700 dark:text-slate-300'}`}>
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
