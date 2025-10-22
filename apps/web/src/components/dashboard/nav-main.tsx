'use client';

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
  useSidebar,
} from '@/components/ui/sidebar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

// NavItem mirrors the menu payload returned by the backend for sidebar rendering.
type NavItem = {
  title: string;
  url: string;
  icon?: ReactNode;
  isActive?: boolean;
  external?: boolean; // open with <a target="_blank" when true
  items?: Array<{
    title: string;
    url: string;
    external?: boolean;
  }>;
};

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const hasAnimatedRef = useRef(false);
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const enableHoverMenus = isCollapsed && !isMobile;
  const showButtonLabel = !isCollapsed || isMobile;
  const collapsedDesktop = isCollapsed && !isMobile;
  const isActiveLink = (url: string, external?: boolean) => {
    if (external || !url || url === '#') {
      return false;
    }
    return pathname.startsWith(url);
  };

  useLayoutEffect(() => {
    const menuEl = menuRef.current;
    if (!menuEl) {
      return;
    }

    const ctx = gsap.context(() => {
      const highlightEls = gsap.utils.toArray<HTMLElement>(
        menuEl.querySelectorAll('[data-sidebar-highlight]'),
      );

      if (highlightEls.length === 0) {
        return;
      }

      gsap.killTweensOf(highlightEls);

      const activeEls = highlightEls.filter(
        (element) => element.dataset.active === 'true',
      );

      const inactiveEls = highlightEls.filter(
        (element) => element.dataset.active !== 'true',
      );

      if (inactiveEls.length > 0) {
        gsap.to(inactiveEls, {
          opacity: 0,
          x: -6,
          duration: 0.18,
          ease: 'power2.out',
          overwrite: 'auto',
          clearProps: 'opacity,transform',
        });
      }

      if (activeEls.length > 0) {
        if (!hasAnimatedRef.current) {
          gsap.set(activeEls, { opacity: 1, x: 0 });
        } else {
          gsap.fromTo(
            activeEls,
            { opacity: 0, x: -8 },
            {
              opacity: 1,
              x: 0,
              duration: 0.24,
              ease: 'power2.out',
              overwrite: 'auto',
              immediateRender: false,
            },
          );
        }
      }
    }, menuEl);

    hasAnimatedRef.current = true;

    return () => {
      ctx.revert();
    };
  }, [pathname, items]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>菜单导航</SidebarGroupLabel>
      <div ref={menuRef}>
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = item.items && item.items.length > 0;
            const active =
              item.isActive ||
              (hasChildren
                ? item.items!.some((child) =>
                    isActiveLink(child.url, child.external),
                  )
                : isActiveLink(item.url, item.external));
            const buttonLabel = showButtonLabel ? (
              <span>{item.title}</span>
            ) : null;
            const buttonClassName = cn(collapsedDesktop && 'justify-center');
            const tooltipLabel = showButtonLabel ? item.title : undefined;

            if (!hasChildren) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={tooltipLabel}
                    isActive={active}
                    asChild
                    className={buttonClassName}
                  >
                    {item.external ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2"
                      >
                        {item.icon}
                        {buttonLabel}
                      </a>
                    ) : (
                      <Link
                        href={`${item.url}`}
                        className="flex items-center gap-2"
                      >
                        {item.icon}
                        {buttonLabel}
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            if (enableHoverMenus) {
              return (
                <SidebarMenuItem key={item.title}>
                  <HoverCard openDelay={120} closeDelay={120}>
                    <HoverCardTrigger asChild>
                      <SidebarMenuButton
                        tooltip={tooltipLabel}
                        isActive={false}
                        className={cn(buttonClassName, active && 'text-primary')}
                      >
                        {item.icon}
                        {buttonLabel}
                      </SidebarMenuButton>
                    </HoverCardTrigger>
                    <HoverCardContent
                      align="start"
                      side="right"
                      sideOffset={12}
                      className="w-60 p-2"
                    >
                      <div className="flex flex-col gap-1">
                        {item.items?.map((subItem) => {
                          const childActive = isActiveLink(
                            subItem.url,
                            subItem.external,
                          );
                          const linkClasses = cn(
                            'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                            childActive
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-muted hover:text-foreground',
                          );

                          if (subItem.external) {
                            return (
                              <a
                                key={subItem.title}
                                href={subItem.url}
                                target="_blank"
                                rel="noreferrer"
                                className={linkClasses}
                              >
                                <span>{subItem.title}</span>
                              </a>
                            );
                          }

                          return (
                            <Link
                              key={subItem.title}
                              href={subItem.url || '#'}
                              className={linkClasses}
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
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
                    <SidebarMenuButton
                      tooltip={tooltipLabel}
                      isActive={false}
                      className={cn(
                        active ? 'text-primary' : undefined,
                        buttonClassName,
                      )}
                    >
                      {item.icon}
                      {buttonLabel ?? <span>{item.title}</span>}
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const childActive = isActiveLink(
                          subItem.url,
                          subItem.external,
                        );

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                          <span
                            data-sidebar-highlight
                            data-active={childActive}
                            className="pointer-events-none absolute inset-0 rounded-md bg-primary/15 opacity-0 shadow-[inset_2px_0_0_0_hsl(var(--primary))] will-change-transform"
                          />
                            <SidebarMenuSubButton
                              asChild
                              isActive={childActive}
                              className="relative z-10 data-[active=true]:bg-transparent data-[active=true]:before:bg-transparent data-[active=true]:before:opacity-0"
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
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </div>
    </SidebarGroup>
  );
}
