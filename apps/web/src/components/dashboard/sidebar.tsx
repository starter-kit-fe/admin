'use client';

import { getMenuTree } from '@/api';
import { LogoMark } from '@/components/logo-mark';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { resolveLucideIcon } from '@/lib/lucide-icons';
import { cn } from '@/lib/utils';
import { MenuNode } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import gpkg from '../../../../../package.json';
import pkg from '../../../package.json';
import { resolveMenuLink } from './menu-routing';
import { NavMain } from './nav-main';

export type NavItem = {
  title: string;
  url: string;
  icon?: ReactNode;
  external?: boolean;
  items?: NavItem[];
};

export function buildNavItems(
  nodes: MenuNode[],
  parentSegments: string[] = [],
  depth = 0,
): NavItem[] {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes
    .filter((node) => !node.hidden)
    .map((node) => {
      const title = node.meta?.title ?? node.name;
      const { url, external, segments } = resolveMenuLink(node, parentSegments);
      const childSegments = external ? parentSegments : segments;
      const children = node.children ?? [];
      const items = buildNavItems(children, childSegments, depth + 1);
      const navItem: NavItem = {
        title,
        url,
        external,
        items: items.length > 0 ? items : undefined,
      };

      const Icon = resolveLucideIcon(node.meta?.icon);
      const iconSizeClass = depth === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5';
      navItem.icon = <Icon className={cn('shrink-0', iconSizeClass)} />;

      return navItem;
    });
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const locale = useLocale() as AppLocale;
  const { data: menuTree = [], isLoading } = useQuery({
    queryKey: ['auth', 'menus', locale],
    queryFn: getMenuTree,
  });
  const [isHydrated, setIsHydrated] = useState(false);

  const navItems = useMemo(() => buildNavItems(menuTree), [menuTree]);

  const brandName = useMemo(() => {
    const title = pkg.seo?.title ?? 'Admin Template';
    return title.split('—')[0]?.trim() ?? title;
  }, []);
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const shouldShowLoading = !isHydrated || isLoading;
  const hasNavItems = navItems.length > 0;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/dashboard" className="cursor-pointer">
          <div
            className={cn(
              'flex items-center px-4 py-3 transition-all duration-200',
              isCollapsed ? 'justify-center gap-0 px-0 py-4' : 'gap-3',
            )}
          >
            <LogoMark
              className={cn('shrink-0', isCollapsed ? 'h-7 w-7' : 'h-8 w-8')}
              gradientIdPrefix="sidebar-logo"
            />
            {!isCollapsed ? (
              <div className="text-left">
                <p className="text-sm font-semibold text-sidebar-foreground">
                  {brandName}
                </p>
                <p className="text-[10px] text-muted-foreground opacity-[60%]">
                  v{gpkg.version}
                </p>
              </div>
            ) : null}
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {shouldShowLoading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            {locale === 'en' ? 'Loading menus…' : '菜单加载中...'}
          </div>
        ) : hasNavItems ? (
          <NavMain items={navItems} />
        ) : (
          <div className="px-4 py-6">
            <Empty className="border-0 bg-transparent p-2">
              <EmptyHeader>
                <EmptyTitle>
                  {locale === 'en' ? 'No menus available' : '暂无可用菜单'}
                </EmptyTitle>
                <EmptyDescription>
                  {locale === 'en'
                    ? 'Ask your administrator to assign permissions.'
                    : '联系管理员为你分配系统权限。'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
