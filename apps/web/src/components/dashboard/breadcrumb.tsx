'use client';

import { getMenuTree } from '@/api';
import { buildNavItems } from '@/components/dashboard/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';

const SEGMENT_LABEL_MAP: Record<string, string> = {
  log: '日志管理',
  operlog: '操作日志',
  logininfor: '登录日志',
  monitor: '系统监控',
  job: '定时任务',
  server: '服务监控',
  user: '用户管理',
  system: '系统管理',
};

type Crumb = {
  label: string;
  href?: string;
};

type NavItemNode = {
  title: string;
  url: string;
  external?: boolean;
  items?: NavItemNode[];
};

function normalizePath(pathname: string) {
  if (!pathname) {
    return '/dashboard';
  }

  const [base] = pathname.split(/[?#]/);
  if (!base) {
    return '/dashboard';
  }

  if (base === '/') {
    return '/';
  }

  return base.length > 1 && base.endsWith('/') ? base.slice(0, -1) : base;
}

function normalizeUrl(url?: string | null) {
  if (!url) {
    return undefined;
  }

  const [base] = url.split(/[?#]/);
  if (!base) {
    return undefined;
  }

  if (base === '/') {
    return '/';
  }

  return base.length > 1 && base.endsWith('/') ? base.slice(0, -1) : base;
}

function formatSegment(segment: string) {
  if (!segment) {
    return '';
  }

  const normalized = segment.toLowerCase();
  if (SEGMENT_LABEL_MAP[normalized]) {
    return SEGMENT_LABEL_MAP[normalized];
  }

  return segment
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function generateFallbackCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return [];
  }

  const normalized =
    segments[0] === 'dashboard' ? segments.slice(1) : segments.slice();

  return normalized.map((segment, index) => {
    const decoded = decodeURIComponent(segment);
    const hrefSegments = ['dashboard', ...normalized.slice(0, index + 1)];
    const href = `/${hrefSegments.join('/')}`;
    return {
      label: formatSegment(decoded) || decoded,
      href: index === normalized.length - 1 ? undefined : href,
    };
  });
}

function findCrumbTrail(
  items: NavItemNode[],
  pathname: string,
): Crumb[] {
  for (const item of items) {
    if (item.external) {
      continue;
    }

    const itemUrl = normalizeUrl(item.url);
    if (!itemUrl) {
      continue;
    }

    const children = item.items ?? [];
    if (children.length > 0) {
      const childTrail = findCrumbTrail(children, pathname);
      if (childTrail.length > 0) {
        return [{ label: item.title, href: itemUrl }, ...childTrail];
      }
    }

    if (pathname === itemUrl || pathname.startsWith(`${itemUrl}/`)) {
      return [{ label: item.title, href: itemUrl }];
    }
  }

  return [];
}

function InternalBreadcrumbLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <BreadcrumbLink asChild>
      <Link href={href} scroll={false}>
        {children}
      </Link>
    </BreadcrumbLink>
  );
}

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const normalizedPath = normalizePath(pathname);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: menuTree = [] } = useQuery({
    queryKey: ['auth', 'menus'],
    queryFn: getMenuTree,
    enabled: isMounted,
  });

  const navItems = useMemo(() => buildNavItems(menuTree), [menuTree]);

  const navCrumbs = useMemo(
    () => findCrumbTrail(navItems as NavItemNode[], normalizedPath),
    [navItems, normalizedPath],
  );

  const fallbackCrumbs = useMemo(
    () => generateFallbackCrumbs(normalizedPath),
    [normalizedPath],
  );

  const crumbs =
    isMounted && navCrumbs.length > 0 ? navCrumbs : fallbackCrumbs;

  const hasExtraCrumbs = crumbs.length > 0;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className={hasExtraCrumbs ? 'hidden md:block' : undefined}>
          {hasExtraCrumbs ? (
            <InternalBreadcrumbLink href="/dashboard">控制台</InternalBreadcrumbLink>
          ) : (
            <BreadcrumbPage>控制台</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.href ?? ''}-${crumb.label}`}>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className={!isLast ? 'hidden md:block' : undefined}>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  crumb.href ? (
                    <InternalBreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </InternalBreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
