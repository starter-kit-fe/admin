import {
  ChevronRight,
  Frame,
  LucideProps,
  SquareTerminal,
  BookA,
  LayoutDashboard,
  UserRoundCog,
  UserRound,
  ShieldCheck,
  FileLock,
  MonitorSmartphone,
  ServerCrash,
  Podcast,
  LifeBuoy,
  Send,
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ForwardRefExoticComponent, RefAttributes } from 'react';
import Link from 'next/link';
interface MenuItemProps {
  title: string;
  url: string;
  icon?: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
  isActive?: boolean;
  items?: MenuItemProps[];
}

const MenuItem = ({ item }: { item: MenuItemProps }) => (
  <Collapsible
    asChild
    defaultOpen={item.isActive}
    className="group/collapsible"
  >
    <SidebarMenuItem>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton tooltip={item.title}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.items && (
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          )}
        </SidebarMenuButton>
      </CollapsibleTrigger>
      {item.items && (
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton asChild>
                  <Link href={subItem.url}>
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      )}
    </SidebarMenuItem>
  </Collapsible>
);
export const data: MenuItemProps[] = [
  {
    title: '总览',
    url: '#',
    icon: SquareTerminal,
    isActive: true,
    items: [
      {
        title: '数据面板',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: '系统',
    url: '#',
    icon: SquareTerminal,
    isActive: true,
    items: [
      {
        title: '字典管理',
        url: '#',
        icon: BookA,
        items: [
          { title: '新增', url: '/dashboard/lookup/create' },
          { title: '列表', url: '/dashboard/lookup/list' },
        ],
      },
      {
        title: '权限管理',
        url: '#',
        icon: ShieldCheck,
        items: [
          { title: '新增', url: '/dashboard/permissions/create' },
          { title: '列表', url: '/dashboard/permissions/list' },
        ],
      },
      {
        title: '角色管理',
        url: '#',
        icon: UserRoundCog,
        items: [
          { title: '列表', url: '#', icon: Frame },
          { title: '新增', url: '#', icon: Frame },
        ],
      },
      {
        title: '用户管理',
        url: '#',
        icon: UserRound,
        items: [
          { title: '列表', url: '#', icon: Frame },
          { title: '新增', url: '#', icon: Frame },
        ],
      },
    ],
  },
  {
    title: '运营',
    url: '#',
    icon: SquareTerminal,
    isActive: true,
    items: [
      {
        title: '日志管理',
        url: '#',
        icon: FileLock,
      },
      {
        title: '设备管理',
        url: '#',
        icon: MonitorSmartphone,
      },
      {
        title: '源IP管理',
        url: '#',
        icon: Podcast,
      },
      {
        title: '服务监控',
        url: '#',
        icon: ServerCrash,
      },
    ],
  },
];
export default function Sidebar() {
  return (
    <nav className="w-64 bg-sidebar">
      {data.map((section) => (
        <SidebarGroup key={section.title}>
          <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
          <SidebarMenu>
            {section.items?.map((item) => (
              <MenuItem key={item.title} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </nav>
  );
}
export const MenuFooter = () => {
  return (
    <SidebarMenu>
      {[
        {
          title: '技术支持',
          url: '#',
          icon: LifeBuoy,
        },
        {
          title: '程序反馈',
          url: '#',
          icon: Send,
        },
      ].map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild size="sm">
            <Link href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};
