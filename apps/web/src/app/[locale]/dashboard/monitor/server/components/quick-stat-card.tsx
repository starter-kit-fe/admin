'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { LucideIcon } from 'lucide-react';

import { safeNumber } from '../lib/format';

export interface QuickStatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  percent: number;
  formatValue: (value: number) => string;
}

export function QuickStatCard({
  icon: Icon,
  label,
  value,
  hint,
  percent,
  formatValue,
}: QuickStatCardProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const previousValueRef = useRef<number>(Number.isFinite(value) ? value : 0);
  const clampedPercent = safeNumber(percent);

  useLayoutEffect(() => {
    const node = barRef.current;
    if (!node) {
      return;
    }
    const ctx = gsap.context(() => {
      gsap.to(node, {
        width: `${clampedPercent}%`,
        duration: 0.8,
        ease: 'power2.out',
      });
    }, node);
    return () => {
      ctx.revert();
    };
  }, [clampedPercent]);

  useLayoutEffect(() => {
    const node = valueRef.current;
    if (!node) {
      return;
    }
    const sanitizedValue = Number.isFinite(value) ? value : 0;
    const startValue = previousValueRef.current ?? sanitizedValue;

    if (startValue === sanitizedValue) {
      node.textContent = formatValue(sanitizedValue);
      previousValueRef.current = sanitizedValue;
      return;
    }

    const ctx = gsap.context(() => {
      const counter = { val: startValue };
      const tween = gsap.to(counter, {
        val: sanitizedValue,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          node.textContent = formatValue(counter.val);
        },
      });
      return () => {
        tween.kill();
      };
    }, node);

    previousValueRef.current = sanitizedValue;

    return () => {
      ctx.revert();
    };
  }, [value, formatValue]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 px-4 py-4 dark:border-border/30">
      <div
        aria-hidden
        ref={barRef}
        className="pointer-events-none absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent transition-[width]"
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
          <span ref={valueRef} className="text-lg font-semibold text-foreground">
            {formatValue(Number.isFinite(value) ? value : 0)}
          </span>
          <span className="text-xs text-muted-foreground/80">{hint}</span>
        </div>
      </div>
    </div>
  );
}
