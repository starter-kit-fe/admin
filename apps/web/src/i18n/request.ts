import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

import type { AppLocale } from './routing';
import { routing } from './routing';

export const loadMessages = async (locale: AppLocale) => {
  switch (locale) {
    case 'en':
      return (await import('../messages/en.json')).default;
    case 'zh':
      return (await import('../messages/zh.json')).default;
    default:
      notFound();
  }
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  return {
    locale,
    messages: await loadMessages(locale),
  };
});
