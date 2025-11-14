import { Badge } from '@/components/ui/badge';
import { Github, Mail, Twitter } from 'lucide-react';
import Link from 'next/link';

import gpkg from '../../../../package.json';
import pkg from '../../package.json';

const FOOTER_LINK_GROUPS = [
  {
    heading: '产品',
    links: [
      { label: '特性概览', href: { pathname: '/', hash: 'features' } },
      { label: '主题系统', href: { pathname: '/', hash: 'themes' } },
      { label: '资源中心', href: { pathname: '/', hash: 'resources' } },
    ],
  },
  {
    heading: '账号',
    links: [
      { label: '登录管理端', href: '/login' },
      { label: '进入 Dashboard', href: '/dashboard' },
      { label: '系统日志', href: '/dashboard/system/log' },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com/starter-kit-fe/admin',
    icon: Github,
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com',
    icon: Twitter,
  },
  {
    label: '邮箱',
    href: 'mailto:service@h06i.com',
    icon: Mail,
  },
] as const;

const LEGAL_LINKS = [
  { label: '服务条款', href: '/terms' },
  { label: '隐私政策', href: '/privacy' },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();
  const keywords = pkg.seo.keywords.slice(0, 4);

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
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span className="sr-only">{label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {FOOTER_LINK_GROUPS.map((section) => (
              <div key={section.heading} className="space-y-3">
                <h3 className="text-sm font-semibold tracking-wide text-foreground/80">
                  {section.heading}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {section.links.map((link) => (
                    <li key={`${section.heading}-${link.label}`}>
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
            ))}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wide text-foreground/80">
                联系我们
              </h3>
              <p className="text-sm text-muted-foreground">
                有任何建议或合作意向，欢迎随时与我们联系。
              </p>
              <Link
                href="mailto:service@h06i.com"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                service@h06i.com
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <p>
              © 2018 - {year} {pkg.seo.og.title}. 保留所有权利。| &nbsp;v
              {gpkg.version}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {LEGAL_LINKS.map(({ label, href }) => (
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
