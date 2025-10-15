'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { ChevronRight } from 'lucide-react';

type NavItem = {
  title: string;
  url: string;
  icon?: ReactNode;
  isActive?: boolean;
  external?: boolean;
  items?: Array<{
    title: string;
    url: string;
    external?: boolean;
  }>;
};

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const isActiveLink = (url: string, external?: boolean) => {
    if (external || !url || url === '#') {
      return false;
    }
    return pathname.startsWith(url);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>菜单导航</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = item.items && item.items.length > 0;
          const active =
            item.isActive ||
            (hasChildren
              ? item.items!.some((child) => isActiveLink(child.url, child.external))
              : isActiveLink(item.url, item.external));

          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} isActive={active} asChild>
                  {item.external ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </a>
                  ) : (
                    <Link
                      href={item.url || '#'}
                      className="flex items-center gap-2"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={active}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={active}>
                    {item.icon}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActiveLink(subItem.url, subItem.external)}
                        >
                          {subItem.external ? (
                            <a
                              href={subItem.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2"
                            >
                              <span>{subItem.title}</span>
                            </a>
                          ) : (
                            <Link
                              href={subItem.url || '#'}
                              className="flex items-center gap-2"
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
