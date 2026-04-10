'use client';

import { useRef, useState } from 'react';
import { Download, Upload, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  unsyncedCount: number;
  onExport: () => void;
  onImport: (file: File) => void;
  onSync:   (apiUrl: string) => Promise<void>;
}

export default function SyncButton({ unsyncedCount, onExport, onImport, onSync }: Props) {
  const [open, setOpen]             = useState(false);
  const [apiUrl, setApiUrl]         = useState('');
  const [syncing, setSyncing]       = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSync() {
    if (!apiUrl.trim()) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      await onSync(apiUrl.trim());
      setSyncResult(`${unsyncedCount}개의 할 일을 성공적으로 동기화했습니다.`);
    } catch (e) {
      setSyncResult(`동기화 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`);
    } finally {
      setSyncing(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    e.target.value = '';
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-xl"
      >
        <span className="flex items-center gap-2">
          데이터 &amp; 동기화
          {unsyncedCount > 0 && (
            <span className="rounded-full bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 text-xs font-semibold text-yellow-800 dark:text-yellow-300">
              미동기화 {unsyncedCount}개
            </span>
          )}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={onExport}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
              <Download size={13} /> JSON 내보내기
            </button>
            <span className="text-xs text-gray-400 dark:text-slate-500">전체 할 일을 백업 파일로 저장</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
              <Upload size={13} /> JSON 불러오기
            </button>
            <span className="text-xs text-gray-400 dark:text-slate-500">백업 파일에서 병합 복원</span>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-slate-400">서버 API 동기화</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://your-api.com/tasks"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleSync}
                disabled={syncing || !apiUrl.trim() || unsyncedCount === 0}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? '동기화 중…' : `동기화 ${unsyncedCount}개`}
              </button>
            </div>
            {syncResult && (
              <p className={`text-xs ${syncResult.startsWith('동기화 실패') ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                {syncResult}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
