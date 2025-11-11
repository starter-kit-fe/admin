'use client';

import { getMenuTree } from '@/api';
import { LogoMark } from '@/components/logo-mark';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import { MenuNode } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useMemo } from 'react';

import pkg from '../../../package.json';
import { resolveMenuLink } from './menu-routing';
import { NavMain } from './nav-main';
import { resolveLucideIcon } from '@/lib/lucide-icons';

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
  const { data: menuTree = [], isLoading } = useQuery({
    queryKey: ['auth', 'menus'],
    queryFn: getMenuTree,
  });

  const navItems = useMemo(() => buildNavItems(menuTree), [menuTree]);

  const brandName = useMemo(() => {
    const title = pkg.seo?.title ?? 'Admin Template';
    return title.split('—')[0]?.trim() ?? title;
  }, []);
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div
          className={cn(
            'flex items-center px-4 py-3 transition-all duration-200',
            isCollapsed ? 'justify-center gap-0 px-0 py-4' : 'gap-3',
          )}
        >
          <LogoMark
            className={cn(
              'shrink-0',
              isCollapsed ? 'h-7 w-7' : 'h-8 w-8',
            )}
          />
          {!isCollapsed ? (
            <div className="text-left">
              <p className="text-sm font-semibold text-sidebar-foreground">
                {brandName}
              </p>
              <p className="text-xs text-muted-foreground">根据权限展示模块</p>
            </div>
          ) : null}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            菜单加载中...
          </div>
        ) : navItems.length > 0 ? (
          <NavMain items={navItems} />
        ) : (
          <div className="px-4 py-6">
            <Empty className="border-0 bg-transparent p-2">
              <EmptyHeader>
                <EmptyTitle>暂无可用菜单</EmptyTitle>
                <EmptyDescription>联系管理员为你分配系统权限。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
