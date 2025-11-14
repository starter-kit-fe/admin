import {Badge} from '@/components/ui/badge';
import {Link} from '@/i18n/navigation';
import {Github, Mail, Twitter} from 'lucide-react';
import {useTranslations} from 'next-intl';

import gpkg from '../../../../package.json';
import pkg from '@/../package.json';

const SOCIAL_LINKS = [
  {
    key: 'github',
    href: 'https://github.com/starter-kit-fe/admin',
    icon: Github,
  },
  {
    key: 'twitter',
    href: 'https://twitter.com',
    icon: Twitter,
  },
  {
    key: 'mail',
    href: 'mailto:service@h06i.com',
    icon: Mail,
  },
] as const;

export default function Footer() {
  const t = useTranslations('Footer');
  const year = new Date().getFullYear();
  const keywords = pkg.seo.keywords.slice(0, 4);
  const productLinks = [
    {label: t('product.overview'), href: {pathname: '/', hash: 'features'}},
    {label: t('product.themes'), href: {pathname: '/', hash: 'themes'}},
    {label: t('product.resources'), href: {pathname: '/', hash: 'resources'}},
  ] as const;
  const accountLinks = [
    {label: t('account.login'), href: '/login'},
    {label: t('account.dashboard'), href: '/dashboard'},
    {label: t('account.logs'), href: '/dashboard/system/log'},
  ] as const;
  const legalLinks = [
    {label: t('legal.terms'), href: '/terms'},
    {label: t('legal.privacy'), href: '/privacy'},
  ] as const;

  return (
    <footer className="border-t bg-background/95">
      <div className="mx-auto  px-6 py-12 md:px-10 lg:px-12 container">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              {pkg.seo.title}
            </Link>
            <p className="max-w-lg text-sm text-muted-foreground">
              {pkg.seo.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="bg-muted/60 text-muted-foreground"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2">
              {SOCIAL_LINKS.map(({ key, href, icon: Icon }) => (
                <Link
                  key={key}
                  href={href}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{t(`social.${key}`)}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-foreground/80">
                {t('headingProduct')}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {productLinks.map((link) => (
                  <li key={`product-${link.label}`}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-foreground/80">
                {t('headingAccount')}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {accountLinks.map((link) => (
                  <li key={`account-${link.label}`}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-foreground/80">
                {t('headingContact')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('contact.body')}
              </p>
              <Link
                href="mailto:service@h06i.com"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                {t('contact.email')}
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <p>
              {t('meta', {
                start: 2018,
                year,
                title: pkg.seo.og.title,
                version: gpkg.version,
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {legalLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-underline-accent  text-muted-foreground transition-colors hover:text-foreground text-[11px]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
