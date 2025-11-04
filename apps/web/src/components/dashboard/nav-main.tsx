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
import type { NavItem } from './sidebar';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

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

  const hasActive = (entry: NavItem): boolean => {
    if (isActiveLink(entry.url, entry.external)) {
      return true;
    }
    if (entry.items && entry.items.length > 0) {
      return entry.items.some((child) => hasActive(child));
    }
    return false;
  };

  const renderHoverEntry = (entry: NavItem, depth = 0): JSX.Element => {
    const key = `${entry.title}-${entry.url ?? 'root'}-${depth}-hover`;
    const children = entry.items ?? [];
    const hasChildren = children.length > 0;
    const active = hasActive(entry);
    const linkClasses = cn(
      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
      active
        ? 'bg-primary/10 text-primary font-semibold'
        : 'hover:bg-muted hover:text-foreground',
    );
    const linkElement = entry.external ? (
      <a
        href={entry.url}
        target="_blank"
        rel="noreferrer"
        className={linkClasses}
      >
        <span>{entry.title}</span>
      </a>
    ) : (
      <Link href={entry.url || '#'} className={linkClasses}>
        <span>{entry.title}</span>
      </Link>
    );

    if (!hasChildren) {
      return (
        <div key={key} className={depth > 0 ? 'pl-3' : undefined}>
          {linkElement}
        </div>
      );
    }

    return (
      <div
        key={key}
        className={cn('flex flex-col gap-1', depth > 0 && 'pl-3')}
      >
        {linkElement}
        <div className="flex flex-col gap-1 border-l border-border/40 pl-3">
          {children.map((child) => renderHoverEntry(child, depth + 1))}
        </div>
      </div>
    );
  };

  const renderSubItems = (entries: NavItem[], depth = 1): JSX.Element[] =>
    entries.map((entry) => {
      const key = `${entry.title}-${entry.url ?? 'root'}-${depth}-sub`;
      const children = entry.items ?? [];
      const hasChildren = children.length > 0;
      const active = hasActive(entry);

      if (!hasChildren) {
        return (
          <SidebarMenuSubItem key={key} className="relative">
            <span
              data-sidebar-highlight
              data-active={active}
              className="pointer-events-none absolute inset-0 rounded-md bg-primary/15 opacity-0 shadow-[inset_2px_0_0_0_hsl(var(--primary))] will-change-transform"
            />
            <SidebarMenuSubButton
              asChild
              isActive={active}
              className="relative z-10 data-[active=true]:bg-transparent data-[active=true]:before:bg-transparent data-[active=true]:before:opacity-0"
            >
              {entry.external ? (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2"
                >
                  <span>{entry.title}</span>
                </a>
              ) : (
                <Link
                  href={entry.url || '#'}
                  className="flex items-center gap-2"
                >
                  <span>{entry.title}</span>
                </Link>
              )}
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        );
      }

      return (
        <Collapsible
          key={key}
          asChild
          defaultOpen={active}
          className="group/subcollapsible"
        >
          <SidebarMenuSubItem className="relative">
            <span
              data-sidebar-highlight
              data-active={active}
              className="pointer-events-none absolute inset-0 rounded-md bg-primary/15 opacity-0 shadow-[inset_2px_0_0_0_hsl(var(--primary))] will-change-transform"
            />
            <CollapsibleTrigger asChild>
              <SidebarMenuSubButton
                isActive={active}
                className="relative z-10 flex w-full items-center gap-2 justify-between data-[active=true]:bg-transparent data-[active=true]:before:bg-transparent data-[active=true]:before:opacity-0"
              >
                <span className="truncate">{entry.title}</span>
                <ChevronRight className="ml-auto size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/subcollapsible:rotate-90" />
              </SidebarMenuSubButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="ml-3 border-l border-border/60 pl-3">
                {renderSubItems(children, depth + 1)}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuSubItem>
        </Collapsible>
      );
    });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>菜单导航</SidebarGroupLabel>
      <div ref={menuRef}>
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = Boolean(item.items && item.items.length > 0);
            const active = hasActive(item);
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
                        isActive={active}
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
                        {item.items?.map((subItem) => renderHoverEntry(subItem))}
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
                      isActive={active}
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
                      {item.items ? renderSubItems(item.items) : null}
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
