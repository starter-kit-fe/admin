'use client';

import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { Info } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import type { MenuType } from '@/app/dashboard/system/menu/type';
import { MENU_TYPE_HINTS, MENU_TYPE_OPTIONS } from './constants';

interface MenuTypeTabsProps {
  value: MenuType;
  onChange: (value: MenuType) => void;
  allowedTypes?: MenuType[];
}

export function MenuTypeTabs({ value, onChange, allowedTypes }: MenuTypeTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const previousRectRef = useRef<{ left: number; width: number } | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const options = useMemo(() => {
    if (!allowedTypes || allowedTypes.length === 0) {
      return MENU_TYPE_OPTIONS;
    }
    const filtered = MENU_TYPE_OPTIONS.filter((option) =>
      allowedTypes.includes(option.value),
    );
    return filtered.length > 0 ? filtered : MENU_TYPE_OPTIONS;
  }, [allowedTypes]);
  const showTabs = options.length > 1;

  useEffect(() => {
    if (options.length === 1 && options[0].value !== value) {
      onChange(options[0].value);
    }
  }, [onChange, options, value]);

  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;
    if (showTabs) {
      gsap.set(indicator, { autoAlpha: 1 });
    } else {
      gsap.set(indicator, { autoAlpha: 0 });
      timelineRef.current?.kill();
      timelineRef.current = null;
      hasInitializedRef.current = false;
      previousRectRef.current = null;
    }
  }, [showTabs]);

  useEffect(() => {
    hasInitializedRef.current = false;
    previousRectRef.current = null;
  }, [options]);

  useLayoutEffect(() => {
    if (!showTabs) return;
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;
    const active = container.querySelector<HTMLButtonElement>(
      `[data-menu-type="${value}"]`,
    );
    if (!active) return;
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const radius = window.getComputedStyle(active).borderRadius;
      gsap.set(indicator, {
        x: active.offsetLeft,
        y: active.offsetTop,
        width: active.offsetWidth,
        height: active.offsetHeight,
        borderRadius: radius,
        autoAlpha: 1,
      });
      previousRectRef.current = {
        left: active.offsetLeft,
        width: active.offsetWidth,
      };
    }
  }, [options, showTabs, value]);

  useEffect(() => {
    if (!showTabs) {
      return;
    }
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

    const radius = window.getComputedStyle(active).borderRadius;
    const previousRect = previousRectRef.current;
    if (!previousRect) {
      gsap.set(indicator, {
        x: offsetLeft,
        y: offsetTop,
        width: offsetWidth,
        height: offsetHeight,
        borderRadius: radius,
        autoAlpha: 1,
      });
      previousRectRef.current = { left: offsetLeft, width: offsetWidth };
      return;
    }

    const travel = offsetLeft - previousRect.left;
    const direction = travel === 0 ? 0 : travel > 0 ? 1 : -1;
    const stretch = Math.min(Math.abs(travel) * 0.6, 36);

    timelineRef.current?.kill();

    const timeline = gsap.timeline();
    timeline.to(indicator, {
      x: offsetLeft - direction * stretch * 0.2,
      y: offsetTop,
      width: offsetWidth + stretch,
      height: offsetHeight,
      borderRadius: radius,
      duration: 0.32,
      ease: 'power2.out',
    });
    timeline.to(
      indicator,
      {
        x: offsetLeft,
        width: offsetWidth,
        duration: 0.28,
        ease: 'power3.out',
      },
      '-=0.14',
    );
    timeline.fromTo(
      indicator,
      { boxShadow: '0 12px 32px -24px rgba(59,130,246,0.35)' },
      {
        boxShadow: '0 18px 42px -26px rgba(59,130,246,0.45)',
        duration: 0.35,
        ease: 'power2.out',
      },
      0,
    );
    timeline.to(
      indicator,
      {
        boxShadow: '0 12px 32px -22px rgba(59,130,246,0.35)',
        duration: 0.36,
        ease: 'power1.out',
      },
      '-=0.1',
    );

    timeline.to(
      active,
      { scale: 1, duration: 0.4, ease: 'back.out(1.6)' },
      0,
    );
    timeline.to(
      Array.from(container.querySelectorAll('button')).filter(
        (button) => button !== active,
      ),
      {
        scale: 1,
        duration: 0.24,
        ease: 'power2.out',
      },
      0,
    );

    timelineRef.current = timeline;
    previousRectRef.current = { left: offsetLeft, width: offsetWidth };

    return () => {
      if (timelineRef.current === timeline) {
        timelineRef.current = null;
      }
      timeline.kill();
    };
  }, [options, showTabs, value]);

  const currentOption = useMemo(
    () =>
      options.find((option) => option.value === value) ?? options[0] ?? MENU_TYPE_OPTIONS[0],
    [options, value],
  );
  const hint = MENU_TYPE_HINTS[currentOption.value];

  return (
    <div className="space-y-4">
      {showTabs ? (
        <div className="relative">
          <div
            ref={containerRef}
            className="relative flex overflow-hidden rounded-2xl border border-border/60 bg-muted/40 p-1 text-sm"
          >
            <div
              ref={indicatorRef}
              className="pointer-events-none absolute top-0 left-0 z-0 rounded-2xl bg-primary/10 shadow-[0_18px_42px_-28px_rgba(59,130,246,0.4)] opacity-0 backdrop-blur-sm"
              style={{
                width: 0,
                height: 0,
              }}
            />
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  data-menu-type={option.value}
                  aria-pressed={active}
                  onClick={() => onChange(option.value)}
                  className={cn(
                    'relative z-10 flex basis-0 flex-1 flex-col items-start gap-1 rounded-xl px-4 py-2 text-left transition-colors',
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
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground">{currentOption.label}</span>
            <span className="text-xs text-muted-foreground">{currentOption.description}</span>
          </div>
        </div>
      )}
      <div className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm">
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
