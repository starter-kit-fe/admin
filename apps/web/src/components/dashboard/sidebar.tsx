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

import { NavMain } from './nav-main';
import pkg from '../../../package.json';

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

function parsePathSegments(path?: string | null): string[] {
  if (!path) {
    return [];
  }
  return path
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment, index, segments) => {
      if (index !== segments.length - 1) {
        return true;
      }
      return segment.toLowerCase() !== 'index';
    });
}

function composeSegments(
  parentSegments: string[],
  currentPath?: string | null,
) {
  const parent = parentSegments;
  const current = parsePathSegments(currentPath);
  if (current.length === 0) {
    return parent;
  }

  const isExplicitAbsolute = Boolean(
    currentPath && currentPath.startsWith('/'),
  );
  const isCurrentAbsolute =
    !isExplicitAbsolute &&
    parent.length > 0 &&
    current.length >= parent.length &&
    parent.every((segment, index) => current[index] === segment);

  if (isExplicitAbsolute || isCurrentAbsolute) {
    return current;
  }

  return [...parent, ...current];
}

function buildDashboardUrl(segments: string[]): string {
  if (segments.length === 0) {
    return '/dashboard';
  }

  if (segments[0] === 'dashboard') {
    return `/${segments.join('/')}`;
  }

  return `/dashboard/${segments.join('/')}`;
}

function isExternalMenu(menu: MenuNode): boolean {
  const path = menu.path ?? '';
  const link = menu.meta?.link ?? '';
  return /^https?:\/\//.test(path) || /^https?:\/\//.test(link ?? '');
}

function resolveMenuLink(menu: MenuNode, parentSegments: string[]) {
  if (isExternalMenu(menu)) {
    const link = menu.meta?.link?.trim();
    const path = (menu.path ?? '').trim();
    return {
      url: link || path || '#',
      segments: parentSegments,
      external: true,
    };
  }

  const segments = composeSegments(parentSegments, menu.path);
  return {
    url: buildDashboardUrl(segments),
    segments,
    external: false,
  };
}

type MenuLink = {
  node: MenuNode;
  url: string;
  external: boolean;
  segments: string[];
};

function collectVisibleLeaves(
  nodes?: MenuNode[],
  parentSegments: string[] = [],
): MenuLink[] {
  if (!nodes) {
    return [];
  }
  return nodes
    .filter((node) => !node.hidden)
    .flatMap((node) => {
      const { url, segments, external } = resolveMenuLink(node, parentSegments);

      if (node.children && node.children.length > 0) {
        const nextSegments = external ? parentSegments : segments;
        const leaves = collectVisibleLeaves(node.children, nextSegments);
        if (leaves.length > 0) {
          return leaves;
        }
      }

      return [
        {
          node,
          url,
          external,
          segments,
        },
      ];
    });
}

export function buildNavItems(
  nodes: MenuNode[],
  parentSegments: string[] = [],
): Array<{
  title: string;
  url: string;
  icon?: ReactNode;
  external?: boolean;
  items?: { title: string; url: string; external?: boolean }[];
}> {
  if (!Array.isArray(nodes)) {
    return [];
  }

  const items: Array<{
    title: string;
    url: string;
    icon?: ReactNode;
    external?: boolean;
    items?: { title: string; url: string; external?: boolean }[];
  }> = [];

  nodes
    .filter((node) => !node.hidden)
    .forEach((node) => {
      const icon = resolveIcon(node.meta?.icon);
      const title = node.meta?.title ?? node.name;
      const { url, external, segments } = resolveMenuLink(node, parentSegments);
      const children = node.children?.filter((child) => !child.hidden) ?? [];

      if (children.length > 0) {
        const childParentSegments = external ? parentSegments : segments;
        const leaves = collectVisibleLeaves(children, childParentSegments);
        if (leaves.length === 0) {
          items.push({ title, url, icon, external });
        } else {
          items.push({
            title,
            url,
            icon,
            external,
            items: leaves.map((leaf) => ({
              title: leaf.node.meta?.title ?? leaf.node.name,
              url: leaf.url,
              external: leaf.external,
            })),
          });
        }
      } else {
        items.push({ title, url, icon, external });
      }
    });

  return items;
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
