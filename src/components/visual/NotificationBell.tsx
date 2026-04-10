'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X } from 'lucide-react';

type PopoverType = 'granted' | 'denied' | null;

export default function NotificationBell() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [popover, setPopover]       = useState<PopoverType>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // 팝오버 외부 클릭 시 닫기
  useEffect(() => {
    if (!popover) return;
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [popover]);

  const handleClick = useCallback(async () => {
    if (!('Notification' in window)) return;

    if (permission === 'granted') {
      // 토글: 팝오버 열기/닫기
      setPopover((v) => (v === 'granted' ? null : 'granted'));
      return;
    }
    if (permission === 'denied') {
      setPopover((v) => (v === 'denied' ? null : 'denied'));
      return;
    }
    // default → 권한 요청
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'denied') setPopover('denied');
  }, [permission]);

  const isGranted = permission === 'granted';
  const isDenied  = permission === 'denied';

  return (
    <div ref={wrapRef} className="relative">
      {/* 벨 버튼 */}
      <button
        onClick={handleClick}
        aria-label={isGranted ? '알림 켜짐' : isDenied ? '알림 차단됨' : '알림 허용하기'}
        className={`relative rounded-xl border p-2 transition-colors ${
          isGranted
            ? 'border-green-300 bg-green-50 text-green-600 dark:border-green-700 dark:bg-green-950 dark:text-green-400'
            : isDenied
            ? 'border-red-200 bg-red-50 text-red-400 dark:border-red-800 dark:bg-red-950 dark:text-red-500'
            : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
        }`}
      >
        {isGranted ? (
          <Bell size={16} />
        ) : (
          /* 벨 + 대각선 취소선 */
          <span className="relative block w-4 h-4">
            <Bell size={16} />
            <svg className="absolute inset-0 w-4 h-4 pointer-events-none" viewBox="0 0 16 16">
              <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
        )}
        {/* 상태 점 */}
        <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white dark:border-slate-800 ${
          isGranted ? 'bg-green-500' : isDenied ? 'bg-red-400' : 'bg-gray-300'
        }`} />
      </button>

      {/* 인라인 팝오버 */}
      {popover && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-50 p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className={`text-xs font-semibold ${
              popover === 'granted'
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {popover === 'granted' ? '알림이 켜져 있습니다' : '알림이 차단되어 있습니다'}
            </p>
            <button
              onClick={() => setPopover(null)}
              className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 shrink-0"
            >
              <X size={12} />
            </button>
          </div>

          {popover === 'granted' && (
            <>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-2">
                알림을 끄려면 브라우저에서 직접 변경해야 합니다.
              </p>
              <ol className="text-[11px] text-gray-600 dark:text-slate-300 space-y-1 list-none">
                <li className="flex gap-1.5">
                  <span className="font-bold text-gray-400 dark:text-slate-500 w-3 shrink-0">1.</span>
                  주소창 왼쪽 <strong>🔒 자물쇠</strong> 아이콘 클릭
                </li>
                <li className="flex gap-1.5">
                  <span className="font-bold text-gray-400 dark:text-slate-500 w-3 shrink-0">2.</span>
                  <strong>알림</strong> 항목 → <strong>차단</strong> 으로 변경
                </li>
                <li className="flex gap-1.5">
                  <span className="font-bold text-gray-400 dark:text-slate-500 w-3 shrink-0">3.</span>
                  페이지 새로고침 (F5)
                </li>
              </ol>
            </>
          )}

          {popover === 'denied' && (
            <>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-2">
                알림을 허용하려면 브라우저 설정을 변경하세요.
              </p>
              <ol className="text-[11px] text-gray-600 dark:text-slate-300 space-y-1 list-none">
                <li className="flex gap-1.5">
                  <span className="font-bold text-gray-400 dark:text-slate-500 w-3 shrink-0">1.</span>
                  주소창 왼쪽 <strong>🔒 자물쇠</strong> 아이콘 클릭
                </li>
                <li className="flex gap-1.5">
                  <span className="font-bold text-gray-400 dark:text-slate-500 w-3 shrink-0">2.</span>
                  <strong>알림</strong> 항목 → <strong>허용</strong> 으로 변경
                </li>
                <li className="flex gap-1.5">
                  <span className="font-bold text-gray-400 dark:text-slate-500 w-3 shrink-0">3.</span>
                  페이지 새로고침 (F5) 후 벨 버튼 재클릭
                </li>
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
}
