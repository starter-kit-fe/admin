import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  defaultLocale: 'zh',
  localePrefix: 'always',
  locales: ['zh', 'en'],
});

export type AppLocale = (typeof routing.locales)[number];
