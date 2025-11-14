import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { Providers } from '@/components/providers';
import type { AppLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const rawLocale = resolvedParams?.locale;
  const locale = routing.locales.find(
    (candidate) => candidate === rawLocale,
  ) as AppLocale | undefined;
  console.log(locale);
  if (!locale) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <>
          {children}
          <CookieConsentBanner />
        </>
      </Providers>
    </NextIntlClientProvider>
  );
}
