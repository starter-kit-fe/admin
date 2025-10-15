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

function resolveMenuUrl(menu: MenuNode): string {
  if (!menu.path) {
    return '#';
  }
  if (menu.external || /^https?:\/\//.test(menu.path)) {
    return menu.path;
  }
  const trimmed = menu.path.replace(/^\/+/, '').replace(/\/$/, '');
  const normalized = trimmed.replace(/\/index$/, '');
  if (!normalized) {
    return '#';
  }
  return `/dashboard/${normalized}`;
}

function collectVisibleLeaves(nodes?: MenuNode[]): MenuNode[] {
  if (!nodes) {
    return [];
  }
  return nodes
    .filter((node) => node.visible != '1')
    .flatMap((node) => {
      if (node.children && node.children.length > 0) {
        return collectVisibleLeaves(node.children);
      }
      return [node];
    });
}

function buildNavItems(nodes: MenuNode[]): Array<{
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
    .filter((node) => node.visible != '1')
    .forEach((node) => {
      const icon = resolveIcon(node.icon);
      const url = resolveMenuUrl(node);
      console.log(url);

      if (node.menu_type == 'M') {
        const leaves = collectVisibleLeaves(node.children);
        if (leaves.length === 0) {
          items.push({ title: node.title, url, icon, external: node.external });
        } else {
          items.push({
            title: node.title,
            url,
            icon,
            external: node.external,
            items: leaves.map((leaf) => ({
              title: leaf.title,
              url: resolveMenuUrl(leaf),
              external: leaf.external,
            })),
          });
        }
      } else {
        items.push({ title: node.title, url, icon, external: node.external });
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
