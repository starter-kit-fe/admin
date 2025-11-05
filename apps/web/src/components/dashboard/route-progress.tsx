'use client';

import gsap from 'gsap';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type RouteProgressBarProps = {
  className?: string;
};

export function RouteProgressBar({ className }: RouteProgressBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const isFirstRenderRef = useRef(true);
  const barRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const rafRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const signature = `${pathname}?${searchParams?.toString() ?? ''}`;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    setIsVisible(true);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    rafRef.current = requestAnimationFrame(() => {
      const bar = barRef.current;
      if (!bar) {
        rafRef.current = null;
        return;
      }

      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => {
          if (!isMountedRef.current) {
            return;
          }
          gsap.set(bar, { opacity: 0, scaleX: 1, clearProps: 'willChange' });
          timelineRef.current = null;
          setIsVisible(false);
        },
      });

      tl.set(bar, {
        transformOrigin: 'left center',
        scaleX: 0.04,
        opacity: 0,
        willChange: 'transform, opacity',
      })
        .to(bar, { opacity: 1, duration: 0.2, ease: 'power1.out' }, 0)
        .to(bar, { scaleX: 0.68, duration: 0.5, ease: 'power3.out' }, 0)
        .to(bar, { scaleX: 0.86, duration: 0.45 }, '>-0.12')
        .to(bar, {
          scaleX: 1,
          duration: 0.32,
          ease: 'power3.inOut',
          delay: 0.12,
        })
        .to(bar, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
          delay: 0.06,
        });

      timelineRef.current = tl;
      rafRef.current = null;
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
  }, [signature]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      data-progress-wrapper
      className={`pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 overflow-hidden ${className ?? ''}`}
    >
      <div className="relative h-full w-full">
        <div
          ref={barRef}
          className="h-full w-full origin-left rounded-r-full bg-gradient-to-r from-primary/45 via-primary to-primary/80 opacity-0"
        />
      </div>
    </div>
  );
}
