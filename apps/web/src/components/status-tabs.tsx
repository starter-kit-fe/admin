'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@repo/ui/components/badge';
import gsap from 'gsap';
import { useCallback, useLayoutEffect, useRef } from 'react';

export type StatusTabItem = {
  value: string;
  label: string;
  count?: number | null;
  activeColor?: string;
};

type StatusTabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  tabs: ReadonlyArray<StatusTabItem>;
  className?: string;
};

export function StatusTabs({
  value,
  onValueChange,
  tabs,
  className,
}: StatusTabsProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefsMap = useRef<Map<string, HTMLButtonElement>>(new Map());
  const mountedRef = useRef(false);

  const setTabRef = useCallback(
    (tabValue: string) => (el: HTMLButtonElement | null) => {
      if (el) tabRefsMap.current.set(tabValue, el);
      else tabRefsMap.current.delete(tabValue);
    },
    [],
  );

  useLayoutEffect(() => {
    const indicator = indicatorRef.current;
    const tab = tabRefsMap.current.get(value);
    if (!indicator || !tab) return;

    if (!mountedRef.current) {
      // First render: snap to position, then reveal
      gsap.set(indicator, {
        x: tab.offsetLeft,
        width: tab.offsetWidth,
        opacity: 1,
      });
      mountedRef.current = true;
    } else {
      // Value changed: smooth slide + resize
      gsap.to(indicator, {
        x: tab.offsetLeft,
        width: tab.offsetWidth,
        duration: 0.32,
        ease: 'power3.out',
      });
    }
  }, [value, tabs]);

  return (
    <div
      role="tablist"
      className={cn(
        'relative inline-flex max-w-full self-start items-center overflow-x-auto rounded-lg bg-muted/60 p-1',
        className,
      )}
    >
      {/* Animated pill */}
      <div
        ref={indicatorRef}
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-md bg-background opacity-0 shadow-sm ring-1 ring-border/40"
      />

      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={setTabRef(tab.value)}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              'relative z-10 flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-center text-sm font-medium transition-colors duration-200',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80',
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <Badge
                variant="secondary"
                className={cn(
                  'rounded-full px-1.5 py-0 text-xs font-medium',
                  isActive && tab.activeColor,
                )}
              >
                {tab.count}
              </Badge>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
