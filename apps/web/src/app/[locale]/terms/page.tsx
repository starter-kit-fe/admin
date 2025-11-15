import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';

type SectionBlock = {
  title?: string;
  paragraphs?: string[];
  list?: string[];
  subList?: string[];
};

type TermsSection = {
  title: string;
  blocks: SectionBlock[];
};

export const metadata: Metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  const t = useTranslations('Terms');
  const introduction = t.raw('introduction') as string[];
  const sections = t.raw('sections') as TermsSection[];

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
        </header>
        <div className="mt-6 space-y-3 text-sm text-muted-foreground">
          {introduction.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-border/60 bg-card/30 p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="mt-4 space-y-4">
                {section.blocks.map((block, index) => (
                  <div key={`${section.title}-${block.title ?? index}`}>
                    {block.title ? (
                      <h3 className="text-base font-semibold text-foreground">
                        {block.title}
                      </h3>
                    ) : null}
                    {block.paragraphs?.map((text) => (
                      <p key={text} className="mt-2">
                        {text}
                      </p>
                    ))}
                    {block.list ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-muted-foreground">
                        {block.list.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {block.subList ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground/80">
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
        </div>
      </div>
    </div>
  );
}
