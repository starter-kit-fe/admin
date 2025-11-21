'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
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
import { cn } from '@/lib/utils';
import {Link, usePathname} from '@/i18n/navigation';
import { ChevronRight, ExternalLink } from 'lucide-react';

import type { NavItem } from './sidebar';

const ExternalLinkIndicator = () => (
  <div
    aria-hidden="true"
    className="ml-auto flex items-center text-muted-foreground/70"
  >
    <ExternalLink className="size-3.5 shrink-0" />
  </div>
);

const NavEntryContent = ({
  entry,
  showExternalIndicator = false,
}: {
  entry: NavItem;
  showExternalIndicator?: boolean;
}) => (
  <>
    {entry.icon}
    <span className="truncate">{entry.title}</span>
    {showExternalIndicator ? <ExternalLinkIndicator /> : null}
  </>
);

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const enableHoverMenus = isCollapsed && !isMobile;
  const showButtonLabel = !isCollapsed || isMobile;
  const collapsedDesktop = isCollapsed && !isMobile;
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const isActiveLink = (url: string, external?: boolean) => {
    if (external || !url || url === '#') {
      return false;
    }
    const normalizedPath = pathname.replace(/\/+$/, '');
    const normalizedUrl = url.replace(/\/+$/, '');
    if (normalizedPath === normalizedUrl) {
      return true;
    }
    return normalizedPath.startsWith(`${normalizedUrl}/`);
  };

  const hoverOverlayClass = cn(
    'relative overflow-hidden hover:!bg-transparent data-[active=true]:!bg-transparent',
    'data-[active=true]:before:content-none data-[active=true]:before:opacity-0',
    'after:pointer-events-none after:absolute after:inset-[1px] after:-z-10 after:rounded-[inherit] after:content-[""] after:opacity-0 after:transition-all after:duration-200 after:bg-gradient-to-r after:from-transparent after:via-transparent after:to-transparent',
    'hover:after:opacity-100 hover:after:from-primary/8 hover:after:via-primary/5 hover:after:to-transparent hover:after:shadow-[0_12px_32px_-26px_rgba(59,130,246,0.25)]',
    'data-[active=true]:after:opacity-100 data-[active=true]:after:from-primary/18 data-[active=true]:after:via-primary/10 data-[active=true]:after:to-transparent data-[active=true]:after:shadow-[0_20px_46px_-28px_rgba(59,130,246,0.5)]',
    'data-[active=true]:!text-primary data-[active=true]:font-semibold data-[active=true]:[&>svg]:!text-primary',
  );

  const hasActive = (entry: NavItem): boolean => {
    if (isActiveLink(entry.url, entry.external)) {
      return true;
    }
    if (entry.items && entry.items.length > 0) {
      return entry.items.some((child) => hasActive(child));
    }
    return false;
  };

  const renderHoverEntry = (entry: NavItem, depth = 0): React.ReactElement => {
    const key = `${entry.title}-${entry.url ?? 'root'}-${depth}-hover`;
    const children = entry.items ?? [];
    const hasChildren = children.length > 0;
    const active = hasActive(entry);
    const linkClasses = cn(
      'flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
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
        onClick={handleNavClick}
      >
        <NavEntryContent entry={entry} showExternalIndicator />
      </a>
    ) : (
      <Link
        href={entry.url || '#'}
        className={linkClasses}
        onClick={handleNavClick}
      >
        <NavEntryContent entry={entry} />
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
      <div key={key} className={cn('flex flex-col gap-1', depth > 0 && 'pl-3')}>
        {linkElement}
        <div className="flex flex-col gap-1 border-l border-border/40 pl-3">
          {children.map((child) => renderHoverEntry(child, depth + 1))}
        </div>
      </div>
    );
  };

  const renderSubItems = (
    entries: NavItem[],
    depth = 1,
  ): React.ReactElement[] =>
    entries.map((entry) => {
      const key = `${entry.title}-${entry.url ?? 'root'}-${depth}-sub`;
      const children = entry.items ?? [];
      const hasChildren = children.length > 0;
      const active = hasActive(entry);

      if (!hasChildren) {
        return (
          <SidebarMenuSubItem key={key} className="relative">
              <SidebarMenuSubButton
                asChild
                isActive={active}
                className={hoverOverlayClass}
              >
                {entry.external ? (
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center gap-2"
                    onClick={handleNavClick}
                  >
                    <NavEntryContent entry={entry} showExternalIndicator />
                  </a>
                ) : (
                  <Link
                    href={entry.url || '#'}
                    className="flex min-w-0 items-center gap-2"
                    onClick={handleNavClick}
                  >
                    <NavEntryContent entry={entry} />
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
            <CollapsibleTrigger asChild>
              <SidebarMenuSubButton
                className={cn(
                  'flex w-full items-center gap-2',
                  hoverOverlayClass,
                )}
              >
                {entry.icon}
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
      <div>
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = Boolean(item.items && item.items.length > 0);
            const active = hasActive(item);
            const buttonLabel = showButtonLabel ? (
              <span className="truncate">{item.title}</span>
            ) : null;
            const buttonClassName = cn(collapsedDesktop && 'justify-center');
            const tooltipLabel = showButtonLabel ? item.title : undefined;
            const showExternalIndicator = item.external && showButtonLabel;

            if (!hasChildren) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={tooltipLabel}
                    isActive={active}
                    asChild
                    className={cn(hoverOverlayClass, buttonClassName)}
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
                        {showExternalIndicator ? (
                          <ExternalLinkIndicator />
                        ) : null}
                      </a>
                    ) : (
                      <Link
                        href={`${item.url}`}
                        className="flex items-center gap-2"
                      >
                        {item.icon}
                        {buttonLabel}
                        {showExternalIndicator ? (
                          <ExternalLinkIndicator />
                        ) : null}
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
                        className={cn(hoverOverlayClass, buttonClassName)}
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
                        {item.items?.map((subItem) =>
                          renderHoverEntry(subItem),
                        )}
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
                      className={cn(hoverOverlayClass, buttonClassName)}
                    >
                      {item.icon}
                      {buttonLabel ?? (
                        <span className="truncate">{item.title}</span>
                      )}
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
