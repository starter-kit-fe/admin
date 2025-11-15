import { messages as staticMessages } from '@/messages';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

import type { AppLocale } from './routing';
import { routing } from './routing';

export const loadMessages = (locale: AppLocale) => {
  const resolved = staticMessages[locale];
  if (!resolved) {
    notFound();
  }
  return resolved;
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  return {
    locale,
    messages: loadMessages(locale),
  };
});
