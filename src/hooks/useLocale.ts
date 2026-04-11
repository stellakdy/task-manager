'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Locale } from '@/utils/i18n';

const STORAGE_KEY = 'locale';

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('ko');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && ['ko', 'en', 'ja'].includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  return { locale, setLocale };
}
