import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  links?: {
    title: string;
    items: {
      title: string;
      href: string;
    }[];
  }[];
}

export default function Footer({
  className,
  links = defaultLinks,
  ...props
}: FooterProps) {
  return (
    <footer
      data-slot="footer"
      className={cn('w-full border-t bg-background py-8', className)}
      {...props}
    >
      <div className="container">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {links.map((section) => (
            <div key={section.title} className="space-y-3">
              <h4 className="text-sm font-medium">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((link) => (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center text-sm text-muted-foreground md:text-left">
            Copyright © {new Date().getFullYear()} My App. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              服务条款
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              隐私政策
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const defaultLinks = [
  {
    title: '产品',
    items: [
      { title: '特性', href: '/features' },
      { title: '价格', href: '/pricing' },
      { title: '文档', href: '/docs' },
    ],
  },
  {
    title: '资源',
    items: [
      { title: '博客', href: '/blog' },
      { title: '下载', href: '/downloads' },
      { title: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: '公司',
    items: [
      { title: '关于我们', href: '/about' },
      { title: '联系我们', href: '/contact' },
      { title: '加入我们', href: '/careers' },
    ],
  },
  {
    title: '社交媒体',
    items: [
      { title: 'Twitter', href: 'https://twitter.com' },
      { title: 'GitHub', href: 'https://github.com' },
      { title: '微博', href: 'https://weibo.com' },
    ],
  },
];