'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuthStatus } from '@/hooks/use-auth';
import { useMenuTree } from '@/hooks/use-menu-tree';
import { MenuNode } from '@/types/menu';
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
import { type ComponentType, type ReactNode, useMemo } from 'react';

import { NavMain } from './nav-main';
import { NavUser } from './nav-user';

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

function composeSegments(parentSegments: string[], currentPath?: string | null) {
  const parent = parentSegments;
  const current = parsePathSegments(currentPath);
  if (current.length === 0) {
    return parent;
  }

  const isExplicitAbsolute = Boolean(currentPath && currentPath.startsWith('/'));
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

function buildNavItems(
  nodes: MenuNode[],
  parentSegments: string[] = [],
): Array<{
  title: string;
  url: string;
  icon?: ReactNode;
  external?: boolean;
  items?: { title: string; url: string; external?: boolean }[];
}> {
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
  const { data: menuTree = [], isLoading } = useMenuTree();
  const { user } = useAuthStatus();

  const navItems = useMemo(() => buildNavItems(menuTree), [menuTree]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-4 py-3 text-left">
          <p className="text-sm font-semibold text-sidebar-foreground">
            控制台导航
          </p>
          <p className="text-xs text-muted-foreground">根据权限展示模块</p>
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
      <SidebarFooter>
        {user ? (
          <NavUser
            user={{
              name: user.nickName || user.userName || '用户',
              email: user.email || '未设置邮箱',
              avatar: user.avatar || '',
            }}
          />
        ) : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
