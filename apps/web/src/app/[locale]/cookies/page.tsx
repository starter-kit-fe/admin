import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

import pkg from '../../../../package.json';

type CookieRow = {
  name: string;
  category: string;
  storage: string;
  duration: string;
  purpose: string;
};

type ManagementItem = {
  label: string;
  description: string;
  email?: string;
  trailing?: string;
};

const resolveSiteName = () =>
  pkg.seo?.title?.split('—')[0]?.trim() ?? pkg.name ?? 'Admin Template';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Cookies');
  const siteName = resolveSiteName();
  return {
    title: t('metadata.title', { siteName }),
    description: t('metadata.description', { siteName }),
  };
}

export default async function Page() {
  const t = await getTranslations('Cookies');
  const siteName = resolveSiteName();

  const tableHeaders = t.raw('cookieTypes.tableHeaders') as string[];
  const cookieRows = t.raw('cookieTypes.rows') as CookieRow[];
  const optionalItems = t.raw('optional.items') as string[];
  const managementItems = t.raw('management.items') as ManagementItem[];

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            {t('metadata.updated')}
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {t('intro.heading', { siteName })}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t.rich('intro.description', {
              siteName,
              terms: (chunks) => (
                <Link
                  href="/terms"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link
                  href="/privacy"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </header>

        <section className="mt-10 space-y-6 rounded-3xl border border-border/70 bg-card/40 p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">{t('cookieTypes.title')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t('cookieTypes.description')}
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border/60">
            <table className="min-w-full divide-y divide-border/60 text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  {tableHeaders.map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 bg-background/80">
                {cookieRows.map((cookie) => (
                  <tr key={cookie.name} className="align-top">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {cookie.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cookie.category}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cookie.storage}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cookie.duration}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cookie.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border/70 bg-primary/5 p-6">
            <h2 className="text-xl font-semibold">{t('optional.title')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('optional.description')}
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {optionalItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border/70 bg-muted/40 p-6">
            <h2 className="text-xl font-semibold">{t('management.title')}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {managementItems.map((item) => (
                <li key={item.label}>
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span> {item.description}</span>
                  {item.email ? (
                    <a
                      href={`mailto:${item.email}`}
                      className="ml-1 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {item.email}
                    </a>
                  ) : null}
                  {item.trailing ? <span>{item.trailing}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
