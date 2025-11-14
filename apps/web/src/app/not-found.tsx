import NotFoundPage from '@/components/not-found-page';
import {loadMessages} from '@/i18n/request';
import {routing} from '@/i18n/routing';
import {NextIntlClientProvider} from 'next-intl';

export default async function NotFound() {
  const locale = routing.defaultLocale;
  const messages = await loadMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NotFoundPage />
    </NextIntlClientProvider>
  );
}
