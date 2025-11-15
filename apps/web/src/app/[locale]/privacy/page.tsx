import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function Page() {
  const t = useTranslations('Privacy');
  const summaryItems = t.raw('intro.summaryItems') as string[];

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            {t('metadata.updated')} ｜ {t('metadata.effective')}
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {t('metadata.title')}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('intro.platform')} · {t('intro.company')}
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{t('intro.summaryLabel')}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground">
            {summaryItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-3xl border border-border/60 bg-card/30 p-6 text-sm leading-relaxed text-muted-foreground shadow-sm">
          <p>{t('body.placeholder')}</p>
        </section>
      </div>
    </div>
  );
}
