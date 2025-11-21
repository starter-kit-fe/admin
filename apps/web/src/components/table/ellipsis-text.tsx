import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface EllipsisTextProps {
  value?: string | null;
  placeholder?: string;
  className?: string;
  tooltipClassName?: string;
}

/**
 * Text block that keeps a fixed width, truncates overflow, and shows full text on hover via tooltip.
 */
export function EllipsisText({
  value,
  placeholder = '—',
  className,
  tooltipClassName,
}: EllipsisTextProps) {
  const display = value && value.trim().length > 0 ? value : null;
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    const node = textRef.current;
    if (!node) return;
    const check = () => {
      setOverflow(node.scrollWidth - node.clientWidth > 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(node);
    window.addEventListener('resize', check);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', check);
    };
  }, [display]);

  useEffect(() => {
    const node = textRef.current;
    if (!node) return;
    setOverflow(node.scrollWidth - node.clientWidth > 1);
  }, [display]);

  const content = (
    <span
      ref={textRef}
      className={cn(
        'block truncate text-sm text-foreground',
        !display && 'text-muted-foreground',
        className,
      )}
      title={overflow ? (display ?? undefined) : undefined}
    >
      {display ?? placeholder}
    </span>
  );

  if (!display || !overflow) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent
        className={cn('max-w-xs break-words text-sm', tooltipClassName)}
      >
        {display}
      </TooltipContent>
    </Tooltip>
  );
}
