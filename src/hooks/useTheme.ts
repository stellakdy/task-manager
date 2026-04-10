'use client';

import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // layout의 인라인 스크립트가 이미 class를 적용했으므로 DOM 상태 동기화만
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

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
