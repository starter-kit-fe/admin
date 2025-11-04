'use client';

import { getMenuTree } from '@/api';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { MenuNode } from '@/types';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Boxes,
  Cog,
  FolderKanban,
  Monitor,
  ShieldCheck,
  SquareTerminal,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { type ComponentType, type ReactNode, useMemo } from 'react';

import pkg from '../../../package.json';
import { resolveMenuLink } from './menu-routing';
import { NavMain } from './nav-main';

const iconRegistry: Record<string, ComponentType<{ className?: string }>> = {
  system: Cog,
  setting: Cog,
  config: Cog,
  monitor: Monitor,
  tool: FolderKanban,
  guide: BookOpen,
  user: Users,
  role: ShieldCheck,
  log: Boxes,
};

const fallbackIcon = SquareTerminal;

function resolveIcon(name?: string | null) {
  const key = (name ?? '').toLowerCase();
  const Icon = iconRegistry[key] ?? fallbackIcon;
  return <Icon className="h-4 w-4" />;
}

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

      if (depth === 0) {
        navItem.icon = resolveIcon(node.meta?.icon);
      }

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
          <Image
            src="/pwa-512x512.png"
            alt={brandName}
            width={isCollapsed ? 28 : 32}
            height={isCollapsed ? 28 : 32}
            className={cn(
              'shrink-0 rounded-lg object-cover',
              isCollapsed ? 'h-7 w-7' : 'h-8 w-8',
            )}
            priority
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
          <div className="px-4 py-6 text-sm text-muted-foreground">
            暂无可用菜单
          </div>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
