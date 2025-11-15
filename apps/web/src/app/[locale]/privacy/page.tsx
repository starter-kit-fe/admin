import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';

type SectionBlock = {
  title?: string;
  paragraphs?: string[];
  list?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
};

type PrivacySection = {
  title: string;
  blocks: SectionBlock[];
};

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function Page() {
  const t = useTranslations('Privacy');
  const summaryItems = t.raw('intro.summaryItems') as string[];
  const sections = t.raw('sections') as PrivacySection[];

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

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
              <div className="mt-4 space-y-4">
                {section.blocks.map((block, index) => (
                  <div key={`${section.title}-${block.title ?? index}`}>
                    {block.title ? (
                      <h3 className="text-base font-semibold text-foreground/90">
                        {block.title}
                      </h3>
                    ) : null}
                    {block.paragraphs?.map((paragraph) => (
                      <p key={paragraph} className="mt-2">
                        {paragraph}
                      </p>
                    ))}
                    {block.list ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-muted-foreground">
                        {block.list.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {block.table ? (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="bg-muted/40 text-foreground">
                            <tr>
                              {block.table.headers.map((header) => (
                                <th key={header} className="px-3 py-2 font-semibold">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            {block.table.rows.map((row, rowIndex) => (
                              <tr
                                key={`${section.title}-row-${rowIndex}`}
                                className="border-t border-border/60"
                              >
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={`${section.title}-row-${rowIndex}-cell-${cellIndex}`}
                                    className="px-3 py-2 align-top"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
