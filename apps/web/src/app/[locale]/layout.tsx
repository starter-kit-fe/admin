import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { Providers } from '@/components/providers';
import { loadMessages } from '@/i18n/request';
import type { AppLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout(props: LocaleLayoutProps) {
  const { children } = props;
  const resolvedParams = await props.params;

  const rawLocale = resolvedParams?.locale;
  const locale = routing.locales.find(
    (candidate) => candidate === rawLocale,
  ) as AppLocale | undefined;
  if (!locale) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = loadMessages(locale);

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <Providers>
        <>
          {children}
          <CookieConsentBanner />
        </>
      </Providers>
    </NextIntlClientProvider>
  );
}
