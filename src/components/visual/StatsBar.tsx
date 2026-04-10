'use client';

interface Stats {
  total: number;
  done: number;
  overdue: number;
  critical: number;
}

export default function StatsBar({ stats }: { stats: Stats }) {
  const rate = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);

  const items = [
    { label: '전체',     value: stats.total,    light: 'bg-gray-100 text-gray-700',         dark: 'dark:bg-slate-700 dark:text-slate-200' },
    { label: '완료',     value: stats.done,     light: 'bg-green-50 text-green-700',         dark: 'dark:bg-green-950 dark:text-green-300' },
    { label: '3시간 이내', value: stats.critical, light: 'bg-red-50 text-red-700',             dark: 'dark:bg-red-950 dark:text-red-300'   },
    { label: '기한 초과', value: stats.overdue,  light: 'bg-purple-50 text-purple-700',       dark: 'dark:bg-purple-950 dark:text-purple-300' },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ label, value, light, dark }) => (
          <div key={label} className={`rounded-xl px-3 py-2.5 flex flex-col items-center ${light} ${dark}`}>
            <span className="text-xl font-bold tabular-nums">{value}</span>
            <span className="text-[10px] font-medium mt-0.5 opacity-70">{label}</span>
          </div>
        ))}
      </div>
      {stats.total > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700"
              style={{ width: `${rate}%` }}
            />
          </div>
          <span className="text-[11px] text-gray-400 dark:text-slate-500 tabular-nums w-8 text-right">
            {rate}%
          </span>
        </div>
      )}
    </div>
  );
}
