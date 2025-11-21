'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

interface NumberTickerProps {
  value: number;
  formatValue?: (value: number) => string;
  duration?: number;
  snap?: number;
  className?: string;
}

const defaultFormat = (val: number) => val.toFixed(0);

export function NumberTicker({
  value,
  formatValue = defaultFormat,
  duration = 0.8,
  snap = 0.1,
  className,
}: NumberTickerProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const previousValueRef = useRef<number>(Number.isFinite(value) ? value : 0);

  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) {
      return;
    }
    const nextValue = Number.isFinite(value) ? value : 0;
    const startValue = previousValueRef.current ?? nextValue;

    if (startValue === nextValue) {
      node.textContent = formatValue(nextValue);
      previousValueRef.current = nextValue;
      return;
    }

    const counter = { val: startValue };

    const ctx = gsap.context(() => {
      const tween = gsap.to(counter, {
        val: nextValue,
        duration,
        ease: 'none',
        snap: { val: snap },
        onUpdate: () => {
          node.textContent = formatValue(counter.val);
        },
        onComplete: () => {
          node.textContent = formatValue(nextValue);
        },
      });
      return () => tween.kill();
    }, node);

    previousValueRef.current = nextValue;

    return () => {
      ctx.revert();
    };
  }, [duration, formatValue, snap, value]);

  const displayValue = formatValue(Number.isFinite(value) ? value : 0);

  return (
    <span ref={nodeRef} className={className}>
      {displayValue}
    </span>
  );
}
