"use client";

import ErrorPage from '@/components/error-page';
import {routing} from '@/i18n/routing';
import type {AppLocale} from '@/i18n/routing';
import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';
import {NextIntlClientProvider} from 'next-intl';

const STATIC_MESSAGES = {
  en: enMessages,
  zh: zhMessages,
} satisfies Record<AppLocale, Record<string, unknown>>;

export default function RootError(props: {error: Error; reset: () => void}) {
  const locale = routing.defaultLocale;
  const messages = STATIC_MESSAGES[locale];

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ErrorPage {...props} />
    </NextIntlClientProvider>
  );
}
