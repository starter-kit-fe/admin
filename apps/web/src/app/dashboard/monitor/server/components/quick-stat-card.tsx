'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { LucideIcon } from 'lucide-react';

import { NumberTicker } from '@/components/number-ticker';

import { safeNumber } from '../lib/format';

export interface QuickStatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  percent: number;
  formatValue: (value: number) => string;
  className?: string;
}

export function QuickStatCard({
  icon: Icon,
  label,
  value,
  hint,
  percent,
  formatValue,
  className,
}: QuickStatCardProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const clampedPercent = safeNumber(percent);

  useLayoutEffect(() => {
    const node = barRef.current;
    if (!node) {
      return;
    }
    const ctx = gsap.context(() => {
      gsap.to(node, {
        width: `${clampedPercent}%`,
        duration: 0.6,
        ease: 'power2.out',
      });
    }, node);
    return () => {
      ctx.revert();
    };
  }, [clampedPercent]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 px-4 py-4 dark:border-border/30 ${className ?? ''}`}
    >
      <div
        aria-hidden
        ref={barRef}
        className="pointer-events-none absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent transition-[width]"
        style={{ width: `${clampedPercent}%` }}
      />
      <div className="relative flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <div className="flex flex-1 flex-col">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <NumberTicker
            value={Number.isFinite(value) ? value : 0}
            formatValue={formatValue}
            className="text-lg font-semibold leading-none text-foreground"
          />
          <span className="text-xs text-muted-foreground/80">{hint}</span>
        </div>
      </div>
    </div>
  );
}
