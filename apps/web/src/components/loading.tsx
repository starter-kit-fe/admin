'use client';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface LoadingPageProps {
  label?: string;
  className?: string;
}

export function LoadingPage({
  label = '页面加载中',
  className,
}: LoadingPageProps) {
  return (
    <div
      className={cn(
        'relative min-h-dvh bg-background text-foreground',
        className,
      )}
    >
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className="loading-top-bar"
      >
        <span className="sr-only">{label}</span>
        <div className="loading-top-bar__progress">
          <div className="loading-top-bar__peg" />
        </div>
      </div>

      <style jsx>{`
        .loading-top-bar {
          pointer-events: none;
          position: fixed;
          inset: 0 0 auto;
          height: 3px;
          width: 100%;
          z-index: 60;
          overflow: hidden;
          filter: drop-shadow(0 4px 12px hsl(var(--primary) / 0.28));
        }

        .loading-top-bar__progress {
          position: absolute;
          inset: 0;
          transform-origin: left center;
          transform: scaleX(0);
          animation: loading-bar-progress 0.85s
            cubic-bezier(0.22, 0.8, 0.32, 1) forwards;
          background-image: linear-gradient(
            90deg,
            hsl(var(--primary)) 0%,
            hsl(var(--primary) / 0.82) 55%,
            hsl(var(--primary) / 0.6) 75%,
            hsl(var(--primary) / 0.4) 100%
          );
          box-shadow: 0 0 12px hsl(var(--primary) / 0.35),
            0 4px 14px hsl(var(--primary) / 0.22);
          border-bottom-right-radius: 999px;
          border-top-right-radius: 999px;
          will-change: transform;
        }

        .loading-top-bar__peg {
          position: absolute;
          right: -56px;
          top: 50%;
          transform: translateY(-50%) rotate(4deg);
          width: 110px;
          height: 160%;
          background-image: linear-gradient(
            90deg,
            hsl(var(--primary) / 0.78),
            transparent 75%
          );
          opacity: 0.9;
          filter: blur(4px);
        }

        @keyframes loading-bar-progress {
          0% {
            transform: scaleX(0);
          }
          35% {
            transform: scaleX(0.3);
          }
          55% {
            transform: scaleX(0.32);
          }
          56% {
            transform: scaleX(1);
          }
          100% {
            transform: scaleX(1);
          }
        }
      `}</style>
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
