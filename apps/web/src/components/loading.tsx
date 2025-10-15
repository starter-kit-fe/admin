'use client';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';

import pkg from '../../package.json';

interface LoadingPageProps {
  label?: string;
  className?: string;
}
export function LoadingPage({ label, className }: LoadingPageProps) {
  const displayName =
    label ??
    pkg.seo?.title?.split('—')?.[0]?.trim() ??
    pkg.name ??
    'Admin Template';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!containerRef.current || !nameRef.current) {
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.loading-line',
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.2,
        },
      );
      //   const gradientTimeline = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
      //   gradientTimeline.fromTo(
      //     '.loading-name',
      //     { backgroundPosition: '0% 50%' },
      //     {
      //       backgroundPosition: '200% 50%',
      //       duration: 1.6,
      //       ease: 'power2.inOut',
      //     },
      //   );
      gsap.fromTo(
        nameRef.current,
        { yPercent: 8, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.2,
          ease: 'power3.out',
        },
      );
    }, containerRef);
    return () => {
      ctx.revert();
    };
  }, []);
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-primary text-primary-foreground',
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.14),_transparent_55%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/95 to-primary/80" />
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
        <p className="loading-line text-xs uppercase tracking-[0.55em] text-primary-foreground/75">
          正在加载
        </p>
        <div
          ref={nameRef}
          className="relative flex min-h-[40vh] items-center justify-center overflow-hidden text-[12vw] font-semibold leading-tight sm:text-[8vw]"
        >
          <span className="loading-name block bg-gradient-to-r from-white via-white/80 to-white/25 bg-[length:200%_100%] bg-clip-text text-transparent">
            {displayName}
          </span>
        </div>
      </div>
    </div>
  );
}
interface InlineLoadingProps {
  label?: string;
  className?: string;
}
export function InlineLoading({
  label = '加载中...',
  className,
}: InlineLoadingProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border border-dashed border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground',
        className,
      )}
    >
      <Spinner className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </div>
  );
}
