'use client';

import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { Info } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

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
    const active = container.querySelector<HTMLButtonElement>(
      `[data-menu-type="${value}"]`,
    );
    if (!active) return;
    gsap.set(indicator, {
      x: active.offsetLeft,
      y: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
      borderRadius: window.getComputedStyle(active).borderRadius,
      autoAlpha: 1,
      scale: 1,
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) {
      return;
    }
    const active = container.querySelector<HTMLButtonElement>(
      `[data-menu-type="${value}"]`,
    );
    if (!active) {
      return;
    }
    const { offsetLeft, offsetWidth } = active;
    const { offsetTop, offsetHeight } = active;

    gsap.killTweensOf(indicator);
    gsap.killTweensOf(container.querySelectorAll('button'));

    const timeline = gsap.timeline();
    timeline.to(indicator, {
      x: offsetLeft,
      y: offsetTop,
      width: offsetWidth,
      height: offsetHeight,
      borderRadius: window.getComputedStyle(active).borderRadius,
      duration: 0.28,
      ease: 'power2.out',
    });
    timeline.fromTo(
      indicator,
      { scale: 0.94 },
      {
        scale: 1,
        duration: 0.5,
        ease: 'elastic.out(1, 0.6)',
        transformOrigin: 'center',
      },
      '<',
    );
    timeline.fromTo(
      indicator,
      { boxShadow: '0 0 0 rgba(59,130,246,0.25)' },
      {
        boxShadow: '0 14px 36px -16px rgba(59,130,246,0.42)',
        duration: 0.45,
        ease: 'power2.out',
      },
      '<',
    );

    gsap.fromTo(
      active,
      { scale: 0.95 },
      {
        scale: 1,
        duration: 0.45,
        ease: 'elastic.out(1, 0.7)',
      },
    );
    gsap.to(
      Array.from(container.querySelectorAll('button')).filter(
        (button) => button !== active,
      ),
      {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out',
      },
    );
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
    return () => {
      timeline.kill();
    };
  }, [value]);

  const currentOption = useMemo(
    () =>
      MENU_TYPE_OPTIONS.find((option) => option.value === value) ??
      MENU_TYPE_OPTIONS[0],
    [value],
  );
  const hint = MENU_TYPE_HINTS[value];

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          ref={containerRef}
          className="relative flex gap-2 overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-1 text-sm"
        >
          <div
            ref={indicatorRef}
            className="pointer-events-none absolute top-0 left-0 z-0 rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 shadow-[0_12px_32px_-12px_rgba(59,130,246,0.45)] opacity-0 backdrop-blur-[1px]"
            style={{
              width: 0,
              height: 0,
            }}
          />
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
                  'relative z-10 flex min-w-[140px] flex-col items-start gap-1 rounded-lg px-3 py-2 text-left transition-colors',
                  'text-muted-foreground hover:text-foreground',
                  active && 'text-foreground',
                )}
              >
                <span
                  className={cn(
                    'font-medium transition-colors',
                    active && 'font-semibold text-foreground',
                  )}
                >
                  {option.label}
                </span>
                <span
                  className={cn(
                    'text-xs text-muted-foreground/80 transition-colors',
                    active && 'text-muted-foreground',
                  )}
                >
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-lg  bg-primary/5 px-3 py-2 text-sm">
        <Info className="mt-0.5 size-4 text-primary" />
        <div className="space-y-1">
          <div className="font-medium text-primary">
            {currentOption.label} · {currentOption.description}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {hint.title}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground/80">
            {hint.helper}
          </p>
        </div>
      </div>
    </div>
  );
}
