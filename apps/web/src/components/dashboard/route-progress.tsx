'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type RouteProgressBarProps = {
  className?: string;
};

export function RouteProgressBar({ className }: RouteProgressBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const isFirstRenderRef = useRef(true);
  const animationFrameRef = useRef<number | null>(null);
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signature = `${pathname}?${searchParams?.toString() ?? ''}`;

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    setIsVisible(true);
    setProgress(0);

    const step = () => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }
        const increment = (90 - prev) * 0.12 + 4;
        const next = Math.min(prev + increment, 90);
        animationFrameRef.current = requestAnimationFrame(step);
        if (next >= 90 && animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return next;
      });
    };

    animationFrameRef.current = requestAnimationFrame(step);

    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    completeTimeoutRef.current = setTimeout(() => {
      setProgress(100);
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 240);
    }, 600);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [signature]);

  if (!isVisible) {
    return null;
  }

  const width = Math.max(progress, 5);
  const indicatorOpacity =
    progress >= 100 ? 0 : progress >= 15 ? 1 : 0;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden ${className ?? ''}`}
    >
      <div
        className="h-full w-full origin-left bg-gradient-to-r from-sky-400 via-primary to-primary/70 transition-[transform,opacity] duration-150 ease-out"
        style={{
          transform: `scaleX(${width / 100})`,
          opacity: progress >= 99 ? 0 : 1,
        }}
      />
      <div
        className="absolute right-0 top-1/2 hidden size-3 -translate-y-1/2 rounded-full bg-primary/50 shadow-[0_0_10px_rgba(59,130,246,0.45)] sm:block"
        style={{
          opacity: indicatorOpacity,
          transition: 'opacity 0.2s ease',
        }}
      />
    </div>
  );
}
