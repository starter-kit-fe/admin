import { redirect } from '@/i18n/navigation';
import { LOCALE_PREFERENCE_KEY } from '@/i18n/preferences';
import type { AppLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get(LOCALE_PREFERENCE_KEY)?.value as
    | AppLocale
    | undefined;
  const locale =
    routing.locales.find((candidate) => candidate === storedLocale) ??
    routing.defaultLocale;

  redirect({ href: '/', locale });
}
