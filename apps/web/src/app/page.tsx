'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import type { AppLocale } from '@/i18n/routing';
import { LOCALE_PREFERENCE_KEY } from '@/i18n/preferences';
import { routing } from '@/i18n/routing';

const LOCALE_SET = new Set<AppLocale>(routing.locales);

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const cookies = typeof document === 'undefined' ? '' : document.cookie;
    const storedLocale = cookies
      .split(';')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${LOCALE_PREFERENCE_KEY}=`))
      ?.split('=')[1] as AppLocale | undefined;

    const locale = storedLocale && LOCALE_SET.has(storedLocale)
      ? storedLocale
      : routing.defaultLocale;

    router.replace(`/${locale}`);
  }, [router]);

  return null;
}
