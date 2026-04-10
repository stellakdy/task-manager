'use client';

import { useMemo, useState } from 'react';
import type { Task } from '@/core/ports/taskRepository';
import { CATEGORIES, CATEGORY_STYLES, type TaskCategory } from '@/utils/categories';

const WEEKS = 17;
const DAY_LABELS = ['월', '', '수', '', '금', '', '일'];
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

interface DayCell {
  date: Date;
  dateStr: string;
  count: number;
  isFuture: boolean;
  dominantCategory: TaskCategory | null;
  breakdown: Partial<Record<TaskCategory, number>>;
}

function buildGrid(tasks: Task[]): { weeks: DayCell[][]; } {
  // 완료된 태스크를 날짜별로 집계
  const byDate = new Map<string, Task[]>();
  for (const t of tasks) {
    if (t.completedAt) {
      // UTC → KST(+9) 날짜 문자열
      const d = new Date(t.completedAt);
      const kstStr = new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10);
      if (!byDate.has(kstStr)) byDate.set(kstStr, []);
      byDate.get(kstStr)!.push(t);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 이번 주 월요일 기준
  const dow = today.getDay(); // 0=일,1=월,...,6=토
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysFromMon);

  // 그리드 시작 = WEEKS주 전 월요일
  const gridStart = new Date(thisMonday);
  gridStart.setDate(thisMonday.getDate() - (WEEKS - 1) * 7);

  const weeks: DayCell[][] = [];
  const cur = new Date(gridStart);

  for (let w = 0; w < WEEKS; w++) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const kstStr = new Date(cur.getTime() + 9 * 3600000).toISOString().slice(0, 10);
      const dayTasks = byDate.get(kstStr) ?? [];
      const isFuture = cur > today;

      // 카테고리별 집계
      const breakdown: Partial<Record<TaskCategory, number>> = {};
      for (const t of dayTasks) {
        const cat = t.category ?? '기타';
        breakdown[cat] = (breakdown[cat] ?? 0) + 1;
      }

      // 최다 카테고리
      const dominant = (Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as TaskCategory | null;

      week.push({
        date:             new Date(cur),
        dateStr:          kstStr,
        count:            dayTasks.length,
        isFuture,
        dominantCategory: dominant,
        breakdown,
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return { weeks };
}

function getCellColor(cell: DayCell): string | undefined {
  if (cell.isFuture || cell.count === 0) return undefined;
  const cat = cell.dominantCategory ?? '기타';
  return CATEGORY_STYLES[cat].dot;
}

function getCellOpacity(count: number): number {
  if (count === 0) return 1;
  if (count === 1) return 0.45;
  if (count === 2) return 0.65;
  if (count <= 4)  return 0.85;
  return 1;
}

function getMonthLabels(weeks: DayCell[][]): { weekIdx: number; label: string }[] {
  const labels: { weekIdx: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const m = week[0].date.getMonth();
    if (m !== lastMonth) {
      labels.push({ weekIdx: i, label: MONTH_NAMES[m] });
      lastMonth = m;
    }
  });
  return labels;
}

interface TooltipState {
  cell: DayCell;
  x: number;
  y: number;
}

export default function HeatmapCalendar({ tasks }: { tasks: Task[] }) {
  const { weeks } = useMemo(() => buildGrid(tasks), [tasks]);
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const totalDone = useMemo(() => tasks.filter((t) => t.completedAt).length, [tasks]);

  const CELL = 12; // px
  const GAP  = 2;  // px

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">활동 기록</h3>
        <span className="text-xs text-gray-400 dark:text-slate-500">
          최근 {WEEKS}주 · 완료 {totalDone}건
        </span>
      </div>

      {/* 월 레이블 */}
      <div className="flex mb-1" style={{ paddingLeft: 20 }}>
        {weeks.map((_, i) => {
          const lbl = monthLabels.find((l) => l.weekIdx === i);
          return (
            <div key={i} style={{ width: CELL + GAP, minWidth: CELL + GAP }}
              className="text-[9px] text-gray-400 dark:text-slate-600 overflow-hidden">
              {lbl?.label ?? ''}
            </div>
          );
        })}
      </div>

      {/* 그리드 */}
      <div className="flex" style={{ gap: GAP }}>
        {/* 요일 레이블 */}
        <div className="flex flex-col" style={{ gap: GAP, marginRight: GAP }}>
          {DAY_LABELS.map((lbl, i) => (
            <div key={i} style={{ width: 14, height: CELL }}
              className="text-[9px] text-gray-400 dark:text-slate-600 flex items-center justify-end pr-0.5">
              {lbl}
            </div>
          ))}
        </div>

        {/* 주(column) */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
            {week.map((cell, di) => {
              const bg  = getCellColor(cell);
              const opa = getCellOpacity(cell.count);
              return (
                <div
                  key={di}
                  style={{
                    width:  CELL,
                    height: CELL,
                    borderRadius: 2,
                    backgroundColor: cell.isFuture
                      ? 'transparent'
                      : bg
                        ? `${bg}${Math.round(opa * 255).toString(16).padStart(2, '0')}`
                        : undefined,
                    cursor: cell.count > 0 ? 'pointer' : 'default',
                  }}
                  className={
                    cell.isFuture
                      ? 'opacity-0'
                      : cell.count === 0
                        ? 'bg-gray-100 dark:bg-slate-700'
                        : ''
                  }
                  onMouseEnter={(e) => {
                    if (cell.count > 0 || !cell.isFuture) {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({ cell, x: rect.left + rect.width / 2, y: rect.top });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* 카테고리 범례 */}
      <div className="flex gap-3 mt-3 flex-wrap">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="flex items-center gap-1">
            <div style={{ width: 8, height: 8, backgroundColor: CATEGORY_STYLES[cat].dot, borderRadius: 2 }} />
            <span className="text-[10px] text-gray-500 dark:text-slate-400">{cat}</span>
          </div>
        ))}
      </div>

      {/* 툴팁 */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-gray-900 dark:bg-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <div className="font-medium">{tooltip.cell.dateStr}</div>
          {tooltip.cell.count === 0 ? (
            <div className="text-gray-400">완료 없음</div>
          ) : (
            <>
              <div className="text-gray-300">총 {tooltip.cell.count}건 완료</div>
              {Object.entries(tooltip.cell.breakdown).map(([cat, cnt]) => (
                <div key={cat} className="flex items-center gap-1 mt-0.5">
                  <div style={{ width: 6, height: 6, backgroundColor: CATEGORY_STYLES[cat as TaskCategory].dot, borderRadius: 1 }} />
                  <span className="text-gray-300">{cat} {cnt}건</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
