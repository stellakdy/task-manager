'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';

const STORAGE_KEY = 'notification-enabled';

export function getNotificationEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export default function NotificationBell() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(getNotificationEnabled());
  }, []);

  const toggle = useCallback(async () => {
    if (enabled) {
      // 끄기
      localStorage.setItem(STORAGE_KEY, 'false');
      setEnabled(false);
      return;
    }

    // 켜기 — 브라우저 권한 확인
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      if (result === 'denied') return; // 브라우저가 차단하면 켤 수 없음
    }

    localStorage.setItem(STORAGE_KEY, 'true');
    setEnabled(true);
  }, [enabled]);

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? '알림 끄기' : '알림 켜기'}
      title={enabled ? '알림 끄기' : '알림 켜기'}
      className={`relative rounded-xl border p-2 transition-colors ${
        enabled
          ? 'border-green-300 bg-green-50 text-green-600 dark:border-green-700 dark:bg-green-950 dark:text-green-400'
          : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
      }`}
    >
      {enabled ? (
        <Bell size={16} />
      ) : (
        <span className="relative block w-4 h-4">
          <Bell size={16} />
          <svg className="absolute inset-0 w-4 h-4 pointer-events-none" viewBox="0 0 16 16">
            <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
      )}
      {/* 상태 점 */}
      <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white dark:border-slate-800 ${
        enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-500'
      }`} />
    </button>
  );
}
