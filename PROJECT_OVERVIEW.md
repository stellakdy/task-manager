# 할 일 관리 앱 — 전체 프로젝트 문서

> 이 문서는 프로젝트의 모든 소스 코드와 구조를 하나의 파일로 정리한 것입니다.
> 3D/개발 개인 작업자를 위한 마감 임박도 시각화 기반 할 일 관리 앱입니다.

---

## 1. 프로젝트 개요

### 목적
- 마감이 얼마나 남았는지 **색상과 애니메이션**으로 즉시 파악 (이모지 없음)
- 로컬에서 완전히 동작 (localStorage) + 추후 서버 전환 가능한 어댑터 구조
- 카테고리(공부/작업/마감/3D/개발/기타)별 관리 및 GitHub 스타일 완료 기록 히트맵

### 기술 스택
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS (darkMode: 'class')
- **아이콘**: lucide-react
- **유틸**: date-fns, uuid

### 실행 방법
```bash
cd D:\web\task-manager
npm run dev        # 개발 서버 (http://localhost:3000)
npm run build      # 프로덕션 빌드
```

---

## 2. 아키텍처 (어댑터 패턴)

```
[ UI Layer: React Components ]
         ↓
[ Business Logic: useTasks Hook ]
         ↓
[ Interface: ITaskRepository ]
         ↓
[ LocalAdapter (localStorage) ] ──(추후 교체)──→ [ RemoteAdapter (Supabase/API) ]
```

서버 도입 시 `useTasks.ts`의 import 한 줄만 변경하면 UI 코드 수정 불필요.

---

## 3. 파일 구조

```
src/
├── app/
│   ├── layout.tsx          # 루트 레이아웃, 다크모드 FOUC 방지 스크립트
│   ├── page.tsx            # 대시보드 메인 페이지
│   └── globals.css         # Tailwind 기본 + glow 애니메이션 + 다크 스크롤바
├── components/
│   ├── visual/
│   │   ├── TaskCard.tsx        # 긴급도 색상 카드 (카테고리 배지, 메모, 게이지)
│   │   ├── UrgencyGauge.tsx    # 마감 임박 진행 바
│   │   ├── StatsBar.tsx        # 통계 요약 (전체/완료/긴급/기한초과 + 완료율)
│   │   ├── HeatmapCalendar.tsx # GitHub 잔디 스타일 완료 기록 히트맵
│   │   └── NotificationBell.tsx# 알림 상태 버튼 (인라인 팝오버)
│   └── migration/
│       └── SyncButton.tsx      # JSON 내보내기/불러오기/서버 동기화
├── core/
│   ├── ports/
│   │   └── taskRepository.ts   # ITaskRepository 인터페이스 + Task 타입
│   └── adapters/
│       ├── localAdapter.ts     # localStorage CRUD 구현체
│       └── remoteAdapter.ts    # 서버 API 스텁 (추후 구현)
├── hooks/
│   ├── useTasks.ts     # 메인 상태 관리 훅 (필터, 검색, 정렬, 알림, completedAt)
│   └── useTheme.ts     # 다크/라이트 모드 토글 훅
└── utils/
    ├── time.ts         # 긴급도 계산, 남은 시간 포맷
    └── categories.ts   # 카테고리 타입 및 색상 정의
```

---

## 4. 데이터 모델

```typescript
// Task 인터페이스
interface Task {
  id: string;           // uuid v4
  title: string;        // 할 일 제목
  notes: string;        // 메모/상세 설명
  category: TaskCategory; // '공부' | '작업' | '마감' | '3D' | '개발' | '기타'
  deadline: string;     // ISO 8601 — 마감 시각
  status: TaskStatus;   // 'todo' | 'in-progress' | 'done'
  lastModified: string; // ISO 8601 — 서버 동기화 충돌 해결용
  isSynced: boolean;    // false = 서버 미업로드
  createdAt: string;    // ISO 8601 — 게이지 퍼센트 계산 기준
  notified: boolean;    // 브라우저 알림 발송 여부
  completedAt?: string; // ISO 8601 — 완료 시각 (잔디용)
}
```

---

## 5. 긴급도 시스템

| 레벨 | 조건 | 배경색 | 효과 |
|------|------|--------|------|
| safe | 3일+ 남음 | 파란 계열 | 없음 |
| moderate | 1~3일 남음 | 초록 계열 | 없음 |
| warning | 24시간 내 | 노란 계열 | 없음 |
| critical | 3시간 내 | 빨간 계열 | 테두리 glow 점멸 |
| overdue | 기한 초과 | 보라 계열 | 없음 |

---

## 6. 카테고리 색상

| 카테고리 | 용도 | 색상(dot) |
|--------|------|---------|
| 공부 | 강의, 리서치, 튜토리얼 | #6366F1 (인디고) |
| 작업 | 실제 제작 작업 | #F59E0B (앰버) |
| 마감 | 납기, 제출 데드라인 | #F43F5E (로즈) |
| 3D | 모델링, 리깅, VFX, 버츄얼 | #8B5CF6 (바이올렛) |
| 개발 | 코딩, 배포, 디버깅 | #10B981 (에메랄드) |
| 기타 | 그 외 | #64748B (슬레이트) |

---

## 7. 주요 기능 목록

1. **긴급도 시각화** — 색상 + glow 애니메이션, 이모지 없음
2. **실시간 검색** — 제목 + 메모 내용 검색
3. **통계 카드** — 전체/완료/3시간이내/기한초과 + 완료율 게이지
4. **활동 기록 히트맵** — 최근 17주, 카테고리별 색상, hover 툴팁
5. **카테고리 필터** — 상태 필터와 조합 가능
6. **빠른 마감 프리셋** — 1시간후/3시간후/오늘자정/내일자정/3일후
7. **메모 필드** — 카드에서 접었다 펼치기, 검색 대상 포함
8. **완료 일괄 삭제** — 완료 항목만 한 번에 정리
9. **다크/라이트 모드** — 시스템 설정 자동 감지, 새로고침 유지
10. **브라우저 알림** — 마감 1시간 전 자동 알림, 인라인 팝오버 UI
11. **JSON 내보내기/불러오기** — 백업 및 복원
12. **서버 동기화 준비** — isSynced 플래그, 미동기화 카운트 표시

---

## 8. 소스 코드 전체

### `tailwind.config.ts`
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        safe:     { bg:"#EFF6FF", card:"#DBEAFE", bar:"#3B82F6", text:"#1E40AF", border:"#93C5FD" },
        moderate: { bg:"#F0FDF4", card:"#DCFCE7", bar:"#22C55E", text:"#166534", border:"#86EFAC" },
        warning:  { bg:"#FFFBEB", card:"#FEF3C7", bar:"#F59E0B", text:"#92400E", border:"#FCD34D" },
        critical: { bg:"#FFF1F2", card:"#FFE4E6", bar:"#EF4444", text:"#7F1D1D", border:"#FCA5A5" },
        overdue:  { bg:"#F5F3FF", card:"#EDE9FE", bar:"#8B5CF6", text:"#4C1D95", border:"#C4B5FD" },
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 4px 1px #FCA5A5" },
          "50%":      { boxShadow: "0 0 14px 5px #EF4444" },
        },
      },
      animation: { glow: "glow-pulse 1.5s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
```

---

### `src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .animate-glow { animation: glow-pulse 1.5s ease-in-out infinite; }
}
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 4px 1px #FCA5A5; }
  50%       { box-shadow: 0 0 14px 5px #EF4444; }
}
.dark ::-webkit-scrollbar { width: 6px; height: 6px; }
.dark ::-webkit-scrollbar-track { background: #1e293b; }
.dark ::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
```

---

### `src/app/layout.tsx`
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "할 일 관리",
  description: "마감 임박도 시각화 기반 할 일 관리 앱",
};

// 다크모드 FOUC 방지: React 렌더 전에 클래스 적용
const darkModeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var p = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (!t && p)) document.documentElement.classList.add('dark');
  } catch(e){}
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body className="bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
```

---

### `src/utils/categories.ts`
```typescript
export type TaskCategory = '공부' | '작업' | '마감' | '3D' | '개발' | '기타';
export const CATEGORIES: TaskCategory[] = ['공부', '작업', '마감', '3D', '개발', '기타'];

export interface CategoryStyle {
  dot: string; bg: string; text: string; border: string; darkBg: string; darkText: string;
}

export const CATEGORY_STYLES: Record<TaskCategory, CategoryStyle> = {
  '공부': { dot:'#6366F1', bg:'#EEF2FF', text:'#4338CA', border:'#C7D2FE', darkBg:'#1e1b4b', darkText:'#a5b4fc' },
  '작업': { dot:'#F59E0B', bg:'#FFFBEB', text:'#92400E', border:'#FDE68A', darkBg:'#1c1307', darkText:'#fcd34d' },
  '마감': { dot:'#F43F5E', bg:'#FFF1F2', text:'#9F1239', border:'#FECDD3', darkBg:'#1c0a0d', darkText:'#fda4af' },
  '3D':   { dot:'#8B5CF6', bg:'#F5F3FF', text:'#5B21B6', border:'#DDD6FE', darkBg:'#1e1233', darkText:'#c4b5fd' },
  '개발': { dot:'#10B981', bg:'#ECFDF5', text:'#065F46', border:'#A7F3D0', darkBg:'#052e16', darkText:'#6ee7b7' },
  '기타': { dot:'#64748B', bg:'#F8FAFC', text:'#475569', border:'#CBD5E1', darkBg:'#0f172a', darkText:'#94a3b8' },
};
```

---

### `src/utils/time.ts`
```typescript
export type UrgencyLevel = 'safe' | 'moderate' | 'warning' | 'critical' | 'overdue';

const HOUR = 3600000;
const DAY  = 86400000;

export function getUrgency(deadline: string): UrgencyLevel {
  const msLeft = new Date(deadline).getTime() - Date.now();
  if (msLeft < 0)        return 'overdue';
  if (msLeft < 3 * HOUR) return 'critical';
  if (msLeft < DAY)      return 'warning';
  if (msLeft < 3 * DAY)  return 'moderate';
  return 'safe';
}

// 생성~마감 중 현재 위치 (0~100%)
export function getUrgencyPercent(deadline: string, createdAt?: string): number {
  const now   = Date.now();
  const end   = new Date(deadline).getTime();
  const start = createdAt ? new Date(createdAt).getTime() : end - 7 * DAY;
  const total = end - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((now - start) / total) * 100)));
}

export function formatTimeLeft(deadline: string): string {
  const msLeft = new Date(deadline).getTime() - Date.now();
  if (msLeft < 0) return '기한 초과';
  const totalMinutes = Math.floor(msLeft / 60000);
  const days    = Math.floor(totalMinutes / 1440);
  const hours   = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0)  return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function urgencyWeight(deadline: string): number {
  const order: Record<UrgencyLevel, number> = { overdue:0, critical:1, warning:2, moderate:3, safe:4 };
  return order[getUrgency(deadline)];
}
```

---

### `src/core/ports/taskRepository.ts`
```typescript
import type { TaskCategory } from '@/utils/categories';
export type { TaskCategory };
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  notes: string;
  category: TaskCategory;
  deadline: string;
  status: TaskStatus;
  lastModified: string;
  isSynced: boolean;
  createdAt: string;
  notified: boolean;
  completedAt?: string;
}

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  create(data: { title: string; notes?: string; category: TaskCategory; deadline: string; status: TaskStatus }): Promise<Task>;
  update(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task>;
  delete(id: string): Promise<void>;
  exportJSON(): Promise<string>;
  importJSON(json: string): Promise<void>;
}
```

---

### `src/core/adapters/localAdapter.ts`
```typescript
import { v4 as uuid } from 'uuid';
import type { ITaskRepository, Task, TaskStatus } from '@/core/ports/taskRepository';
import type { TaskCategory } from '@/utils/categories';

const STORAGE_KEY = 'task-manager-v1';

function readStorage(): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Partial<Task>[];
    return raw.map((t) => ({
      id: t.id ?? uuid(),
      title: t.title ?? '',
      notes: t.notes ?? '',
      category: t.category ?? '기타',
      deadline: t.deadline ?? new Date().toISOString(),
      status: t.status ?? 'todo',
      lastModified: t.lastModified ?? new Date().toISOString(),
      isSynced: t.isSynced ?? false,
      createdAt: t.createdAt ?? t.lastModified ?? new Date().toISOString(),
      notified: t.notified ?? false,
      completedAt: t.completedAt,
    }));
  } catch { return []; }
}

function writeStorage(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function mergeByLastModified(existing: Task[], incoming: Task[]): Task[] {
  const map = new Map<string, Task>();
  for (const t of existing) map.set(t.id, t);
  for (const t of incoming) {
    const cur = map.get(t.id);
    if (!cur || new Date(t.lastModified) > new Date(cur.lastModified)) map.set(t.id, t);
  }
  return Array.from(map.values());
}

class LocalAdapter implements ITaskRepository {
  async getAll() { return readStorage(); }

  async create(data: { title: string; notes?: string; category: TaskCategory; deadline: string; status: TaskStatus }): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = { notes:'', ...data, id: uuid(), lastModified: now, createdAt: now, isSynced: false, notified: false };
    writeStorage([...readStorage(), task]);
    return task;
  }

  async update(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    const tasks = readStorage();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Task ${id} not found`);
    const updated: Task = { ...tasks[idx], ...patch, id, createdAt: tasks[idx].createdAt, lastModified: new Date().toISOString(), isSynced: patch.isSynced ?? false };
    tasks[idx] = updated;
    writeStorage(tasks);
    return updated;
  }

  async delete(id: string) { writeStorage(readStorage().filter((t) => t.id !== id)); }
  async exportJSON()       { return JSON.stringify(readStorage(), null, 2); }
  async importJSON(json: string) {
    const incoming: Task[] = JSON.parse(json);
    writeStorage(mergeByLastModified(readStorage(), incoming));
  }
}

export const taskRepository: ITaskRepository = new LocalAdapter();
```

---

### `src/core/adapters/remoteAdapter.ts`
```typescript
// 서버 전환 시 이 파일의 메서드를 구현하고
// useTasks.ts의 import를 localAdapter → remoteAdapter로 변경
import type { ITaskRepository, Task, TaskStatus } from '@/core/ports/taskRepository';

export class RemoteAdapter implements ITaskRepository {
  constructor(private apiBase: string) {}
  async getAll(): Promise<Task[]> {
    const res = await fetch(`${this.apiBase}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  }
  async create(data: { title: string; notes?: string; deadline: string; status: TaskStatus }): Promise<Task> {
    const res = await fetch(`${this.apiBase}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  }
  async update(id: string, patch: Partial<Omit<Task, 'id'|'createdAt'>>): Promise<Task> {
    const res = await fetch(`${this.apiBase}/tasks/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(patch) });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  }
  async delete(id: string): Promise<void> {
    const res = await fetch(`${this.apiBase}/tasks/${id}`, { method:'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
  }
  async exportJSON(): Promise<string> { return JSON.stringify(await this.getAll(), null, 2); }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async importJSON(_json: string): Promise<void> { throw new Error('Not implemented'); }
}
```

---

### `src/hooks/useTheme.ts`
```typescript
'use client';
import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')); }, []);
  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);
  return { dark, toggle };
}
```

---

### `src/hooks/useTasks.ts`
```typescript
'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { taskRepository } from '@/core/adapters/localAdapter';
import type { Task, TaskStatus } from '@/core/ports/taskRepository';
import type { TaskCategory } from '@/utils/categories';
import { urgencyWeight } from '@/utils/time';

export type FilterStatus   = 'all' | TaskStatus;
export type FilterCategory = 'all' | TaskCategory;

function sortByUrgency(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const wa = urgencyWeight(a.deadline), wb = urgencyWeight(b.deadline);
    if (wa !== wb) return wa - wb;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

function sendNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/favicon.ico' });
}

export function useTasks() {
  const [tasks, setTasks]                   = useState<Task[]>([]);
  const [filter, setFilter]                 = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    taskRepository.getAll().then((loaded) => {
      setTasks(loaded);
      loaded.filter((t) => t.notified).forEach((t) => notifiedRef.current.add(t.id));
    });
  }, []);

  // 1분 ticker + 마감 1시간 전 브라우저 알림
  useEffect(() => {
    const tick = async () => {
      const all = await taskRepository.getAll();
      const toNotify = all.filter((t) => {
        if (t.status === 'done' || notifiedRef.current.has(t.id)) return false;
        const msLeft = new Date(t.deadline).getTime() - Date.now();
        return msLeft > 0 && msLeft <= 60 * 60 * 1000;
      });
      for (const t of toNotify) {
        sendNotification('마감 1시간 전', `"${t.title}" 마감이 1시간 이내로 다가왔습니다.`);
        notifiedRef.current.add(t.id);
        await taskRepository.update(t.id, { notified: true });
      }
      setTasks([...all]);
    };
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  const displayedTasks = useMemo(() => {
    let list = tasks;
    if (filter !== 'all') list = list.filter((t) => t.status === filter);
    if (categoryFilter !== 'all') list = list.filter((t) => t.category === categoryFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q));
    }
    return sortByUrgency(list);
  }, [tasks, filter, categoryFilter, searchQuery]);

  const stats = useMemo(() => ({
    total:    tasks.length,
    done:     tasks.filter((t) => t.status === 'done').length,
    overdue:  tasks.filter((t) => t.status !== 'done' && new Date(t.deadline) < new Date()).length,
    critical: tasks.filter((t) => { if (t.status === 'done') return false; const ms = new Date(t.deadline).getTime() - Date.now(); return ms > 0 && ms <= 3 * 3600000; }).length,
  }), [tasks]);

  const unsyncedCount = useMemo(() => tasks.filter((t) => !t.isSynced).length, [tasks]);

  const addTask = useCallback(async (data: { title: string; notes?: string; category: TaskCategory; deadline: string; status: TaskStatus }) => {
    const task = await taskRepository.create(data);
    setTasks((prev) => [...prev, task]);
  }, []);

  const updateTask = useCallback(async (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    const task = tasks.find((t) => t.id === id);
    const enriched = { ...patch };
    if (patch.status === 'done' && task?.status !== 'done') enriched.completedAt = new Date().toISOString();
    else if (patch.status && patch.status !== 'done' && task?.status === 'done') enriched.completedAt = undefined;
    const updated = await taskRepository.update(id, enriched);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, [tasks]);

  const deleteTask      = useCallback(async (id: string) => { await taskRepository.delete(id); setTasks((prev) => prev.filter((t) => t.id !== id)); }, []);
  const deleteDoneTasks = useCallback(async () => { const done = tasks.filter((t) => t.status === 'done'); await Promise.all(done.map((t) => taskRepository.delete(t.id))); setTasks((prev) => prev.filter((t) => t.status !== 'done')); }, [tasks]);

  const exportJSON = useCallback(async () => {
    const json = await taskRepository.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `tasks-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importJSON  = useCallback(async (file: File) => { const text = await file.text(); await taskRepository.importJSON(text); setTasks(await taskRepository.getAll()); }, []);
  const syncToServer = useCallback(async (apiUrl: string) => {
    const unsynced = tasks.filter((t) => !t.isSynced);
    if (unsynced.length === 0) return;
    await Promise.all(unsynced.map((t) => fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(t) }).then((res) => { if (!res.ok) throw new Error(`Failed: ${t.id}`); })));
    await Promise.all(unsynced.map((t) => taskRepository.update(t.id, { isSynced: true })));
    setTasks(await taskRepository.getAll());
  }, [tasks]);

  return { tasks: displayedTasks, allTasks: tasks, filter, setFilter, categoryFilter, setCategoryFilter, searchQuery, setSearchQuery, stats, unsyncedCount, addTask, updateTask, deleteTask, deleteDoneTasks, exportJSON, importJSON, syncToServer };
}
```

---

### `src/components/visual/UrgencyGauge.tsx`
```tsx
'use client';
import { getUrgency, getUrgencyPercent, UrgencyLevel } from '@/utils/time';

const barColors: Record<UrgencyLevel, string> = {
  safe:'#3B82F6', moderate:'#22C55E', warning:'#F59E0B', critical:'#EF4444', overdue:'#8B5CF6'
};

export default function UrgencyGauge({ deadline, createdAt }: { deadline: string; createdAt?: string }) {
  const level   = getUrgency(deadline);
  const percent = getUrgencyPercent(deadline, createdAt);
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${percent}%`, backgroundColor: barColors[level] }} />
    </div>
  );
}
```

---

### `src/components/visual/StatsBar.tsx`
```tsx
'use client';
interface Stats { total: number; done: number; overdue: number; critical: number; }

export default function StatsBar({ stats }: { stats: Stats }) {
  const rate = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);
  const items = [
    { label:'전체',     value: stats.total,    light:'bg-gray-100 text-gray-700',   dark:'dark:bg-slate-700 dark:text-slate-200' },
    { label:'완료',     value: stats.done,     light:'bg-green-50 text-green-700',  dark:'dark:bg-green-950 dark:text-green-300' },
    { label:'3시간 이내', value: stats.critical, light:'bg-red-50 text-red-700',     dark:'dark:bg-red-950 dark:text-red-300'    },
    { label:'기한 초과', value: stats.overdue,  light:'bg-purple-50 text-purple-700', dark:'dark:bg-purple-950 dark:text-purple-300' },
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
            <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width:`${rate}%` }} />
          </div>
          <span className="text-[11px] text-gray-400 dark:text-slate-500 tabular-nums w-8 text-right">{rate}%</span>
        </div>
      )}
    </div>
  );
}
```

---

### `src/components/visual/NotificationBell.tsx`
```tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
type PopoverType = 'granted' | 'denied' | null;

export default function NotificationBell() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [popover, setPopover]       = useState<PopoverType>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!popover) return;
    function onOutside(e: MouseEvent) { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPopover(null); }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [popover]);

  const handleClick = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (permission === 'granted') { setPopover((v) => (v === 'granted' ? null : 'granted')); return; }
    if (permission === 'denied')  { setPopover((v) => (v === 'denied'  ? null : 'denied'));  return; }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'denied') setPopover('denied');
  }, [permission]);

  const isGranted = permission === 'granted';
  const isDenied  = permission === 'denied';

  return (
    <div ref={wrapRef} className="relative">
      <button onClick={handleClick}
        className={`relative rounded-xl border p-2 transition-colors ${isGranted ? 'border-green-300 bg-green-50 text-green-600 dark:border-green-700 dark:bg-green-950 dark:text-green-400' : isDenied ? 'border-red-200 bg-red-50 text-red-400 dark:border-red-800 dark:bg-red-950 dark:text-red-500' : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
        {isGranted ? <Bell size={16} /> : (
          <span className="relative block w-4 h-4">
            <Bell size={16} />
            <svg className="absolute inset-0 w-4 h-4 pointer-events-none" viewBox="0 0 16 16">
              <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
        )}
        <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white dark:border-slate-800 ${isGranted ? 'bg-green-500' : isDenied ? 'bg-red-400' : 'bg-gray-300'}`} />
      </button>

      {popover && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-50 p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className={`text-xs font-semibold ${popover === 'granted' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {popover === 'granted' ? '알림이 켜져 있습니다' : '알림이 차단되어 있습니다'}
            </p>
            <button onClick={() => setPopover(null)} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 shrink-0"><X size={12} /></button>
          </div>
          <ol className="text-[11px] text-gray-600 dark:text-slate-300 space-y-1 list-none">
            <li className="flex gap-1.5"><span className="text-gray-400 dark:text-slate-500 w-3 shrink-0">1.</span>주소창 왼쪽 <strong>🔒</strong> 아이콘 클릭</li>
            <li className="flex gap-1.5"><span className="text-gray-400 dark:text-slate-500 w-3 shrink-0">2.</span><strong>알림</strong> → <strong>{popover === 'granted' ? '차단' : '허용'}</strong>으로 변경</li>
            <li className="flex gap-1.5"><span className="text-gray-400 dark:text-slate-500 w-3 shrink-0">3.</span>페이지 새로고침 (F5)</li>
          </ol>
        </div>
      )}
    </div>
  );
}
```

---

### `src/components/migration/SyncButton.tsx`
```tsx
'use client';
import { useRef, useState } from 'react';
import { Download, Upload, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Props { unsyncedCount: number; onExport: () => void; onImport: (file: File) => void; onSync: (apiUrl: string) => Promise<void>; }

export default function SyncButton({ unsyncedCount, onExport, onImport, onSync }: Props) {
  const [open, setOpen]             = useState(false);
  const [apiUrl, setApiUrl]         = useState('');
  const [syncing, setSyncing]       = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSync() {
    if (!apiUrl.trim()) return;
    setSyncing(true); setSyncResult(null);
    try { await onSync(apiUrl.trim()); setSyncResult(`${unsyncedCount}개의 할 일을 성공적으로 동기화했습니다.`); }
    catch (e) { setSyncResult(`동기화 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`); }
    finally { setSyncing(false); }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-xl">
        <span className="flex items-center gap-2">
          데이터 &amp; 동기화
          {unsyncedCount > 0 && <span className="rounded-full bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 text-xs font-semibold text-yellow-800 dark:text-yellow-300">미동기화 {unsyncedCount}개</span>}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={onExport} className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"><Download size={13} /> JSON 내보내기</button>
            <span className="text-xs text-gray-400 dark:text-slate-500">전체 할 일을 백업 파일로 저장</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"><Upload size={13} /> JSON 불러오기</button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value=''; }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">서버 API 동기화</label>
            <div className="flex gap-2">
              <input type="url" placeholder="https://your-api.com/tasks" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={handleSync} disabled={syncing || !apiUrl.trim() || unsyncedCount === 0} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? '동기화 중…' : `동기화 ${unsyncedCount}개`}
              </button>
            </div>
            {syncResult && <p className={`text-xs ${syncResult.startsWith('동기화 실패') ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>{syncResult}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 9. 향후 추가 예정 기능 (개인 3D/개발 작업자 맞춤 추천)

| 기능 | 이유 |
|------|------|
| 레퍼런스 URL 저장 | 블렌더 튜토리얼, docs 링크를 메모 없이 바로 연결 |
| 예상 소요 시간 입력 | "모델링 4시간 예상" → 마감과 비교해 현실 체크 |
| 진행률 슬라이더 (0~100%) | 리깅/VFX처럼 중간 상태가 의미 있는 작업 |
| 프로젝트 그룹 | "MV프로젝트" 안에 모델링/리깅/렌더링 서브태스크 묶기 |
| 반복 일정 | 매주 업로드, 정기 스트림 일정 |
| 포모도로 타이머 | 작업 카드에서 바로 집중 세션 시작 |
| 파일 경로 메모 | 프로젝트 파일 위치 복사 → 탐색기 바로 열기 |
| 태그 | `#blender #unity #nextjs` 자유 분류 + 필터 |

---

## 10. localStorage 데이터 구조 예시

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "캐릭터 리깅 완성",
    "notes": "spine IK 설정 참고: https://...",
    "category": "3D",
    "deadline": "2026-04-15T18:00:00.000Z",
    "status": "in-progress",
    "lastModified": "2026-04-10T09:30:00.000Z",
    "isSynced": false,
    "createdAt": "2026-04-08T10:00:00.000Z",
    "notified": false,
    "completedAt": null
  }
]
```

---

*문서 생성일: 2026-04-10*
*프로젝트 경로: D:\web\task-manager*
