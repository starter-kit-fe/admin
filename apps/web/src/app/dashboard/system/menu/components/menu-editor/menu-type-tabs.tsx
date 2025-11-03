'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Info } from 'lucide-react';
import gsap from 'gsap';

import { cn } from '@/lib/utils';

import type { MenuType } from '../../type';
import { MENU_TYPE_HINTS, MENU_TYPE_OPTIONS } from './constants';

interface MenuTypeTabsProps {
  value: MenuType;
  onChange: (value: MenuType) => void;
}

export function MenuTypeTabs({ value, onChange }: MenuTypeTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;
    const active = container.querySelector<HTMLButtonElement>(`[data-menu-type="${value}"]`);
    if (!active) return;
    gsap.set(indicator, {
      x: active.offsetLeft,
      width: active.offsetWidth,
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) {
      return;
    }
    const active = container.querySelector<HTMLButtonElement>(`[data-menu-type="${value}"]`);
    if (!active) {
      return;
    }
    const { offsetLeft, offsetWidth } = active;
    gsap.to(indicator, {
      x: offsetLeft,
      width: offsetWidth,
      duration: 0.35,
      ease: 'power2.out',
    });

    const padding = 24;
    const { scrollLeft, clientWidth } = container;
    const targetLeft = offsetLeft - padding;
    const targetRight = offsetLeft + offsetWidth + padding;
    let nextScroll = scrollLeft;
    if (targetLeft < scrollLeft) {
      nextScroll = targetLeft;
    } else if (targetRight > scrollLeft + clientWidth) {
      nextScroll = targetRight - clientWidth;
    }
    gsap.to(container, {
      scrollLeft: Math.max(nextScroll, 0),
      duration: 0.4,
      ease: 'power2.out',
    });
  }, [value]);

  const currentOption = useMemo(
    () => MENU_TYPE_OPTIONS.find((option) => option.value === value) ?? MENU_TYPE_OPTIONS[0],
    [value],
  );
  const hint = MENU_TYPE_HINTS[value];

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          ref={containerRef}
          className="flex gap-2 overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-1 text-sm"
        >
          {MENU_TYPE_OPTIONS.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                data-menu-type={option.value}
                aria-pressed={active}
                onClick={() => onChange(option.value)}
                className={cn(
                  'flex min-w-[140px] flex-col items-start gap-1 rounded-lg px-3 py-2 text-left transition-colors',
                  'text-muted-foreground hover:text-foreground',
                  active && 'bg-background text-foreground shadow-sm',
                )}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs">{option.description}</span>
              </button>
            );
          })}
        </div>
        <div
          ref={indicatorRef}
          className="pointer-events-none absolute bottom-0 left-1 h-[3px] rounded-full bg-primary"
          style={{ width: 0 }}
        />
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
        <Info className="mt-0.5 size-4 text-primary" />
        <div className="space-y-1">
          <div className="font-medium text-primary">
            {currentOption.label} · {currentOption.description}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{hint.title}</p>
          <p className="text-xs leading-relaxed text-muted-foreground/80">{hint.helper}</p>
        </div>
      </div>
    </div>
  );
}
