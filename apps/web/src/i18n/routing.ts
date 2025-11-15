import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  defaultLocale: 'en',
  localePrefix: 'always',
  locales: ['zh-Hans', 'en'],
});

export type AppLocale = (typeof routing.locales)[number];
