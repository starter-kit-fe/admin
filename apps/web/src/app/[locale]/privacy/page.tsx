import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Privacy');
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
  };
}

type SectionBlock = {
  title?: string;
  paragraphs?: string[];
  list?: string[];
  subList?: string[];
};

type Section = {
  title: string;
  blocks?: SectionBlock[];
};

export default async function Page() {
  const t = await getTranslations('Privacy');
  const updatedLabel = t('metadata.updatedLabel', { date: t('metadata.updated') });
  const effectiveLabel = t('metadata.effectiveLabel', {
    date: t('metadata.effective'),
  });

  const introParagraphs = t.raw('intro.paragraphs') as string[];
  const summaryItems = t.raw('intro.summaryItems') as string[];
  const sections = t.raw('sections') as Section[];

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            {updatedLabel} ｜ {effectiveLabel}
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {t('intro.platform')} {t('metadata.title')}
          </h1>
          {introParagraphs.map((_, index) => (
            <p
              key={`intro-${index}`}
              className="text-sm leading-relaxed text-muted-foreground"
            >
              {t(`intro.paragraphs.${index}`, {
                company: t('intro.company'),
                platform: t('intro.platform'),
                site: t('intro.site'),
              })}
            </p>
          ))}
        </header>

        <section className="mt-8 rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{t('intro.summaryLabel')}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground">
            {summaryItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <article className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="mt-4 space-y-4">
                {section.blocks?.map((block, index) => (
                  <div
                    key={block.title ?? `${section.title}-${index}`}
                    className="rounded-2xl border border-border/40 bg-background/70 p-4 space-y-3"
                  >
                    {block.title ? (
                      <h3 className="text-base font-semibold text-foreground">
                        {block.title}
                      </h3>
                    ) : null}
                    {block.paragraphs?.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {block.list ? (
                      <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
                        {block.list.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {block.subList ? (
                      <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
                        {block.subList.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
