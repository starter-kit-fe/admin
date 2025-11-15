'use client';

import type { AppLocale } from '@/i18n/routing';
import http from '@/lib/request';
import { useLocaleStore } from '@/stores';
import { LOCALE_PREFERENCE_KEY } from '@/i18n/preferences';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';

const LANGUAGE_TAG_MAP: Record<AppLocale, string> = {
  en: 'en',
  'zh-Hans': 'zh-Hans',
};

export function LocaleSyncer() {
  const locale = useLocale() as AppLocale;
  const languageTag = LANGUAGE_TAG_MAP[locale] ?? locale;
  const { setLocalePreference } = useLocaleStore();

  useEffect(() => {
    http.updateLocale(languageTag);
    setLocalePreference(locale);
    if (typeof document === 'undefined') {
      return;
    }
    document.cookie = `${LOCALE_PREFERENCE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = languageTag;
  }, [languageTag, locale, setLocalePreference]);

  return null;
}
