'use client';

import type { ReactNode } from 'react';

export interface InfoRowProps {
  label: string;
  value: ReactNode;
  align?: 'left' | 'right';
  valueClassName?: string;
}

export function InfoRow({
  label,
  value,
  align = 'right',
  valueClassName,
}: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-sm font-medium text-foreground ${align === 'left' ? 'text-left' : 'text-right'} ${valueClassName ?? ''}`}
      >
        {value}
      </span>
    </div>
  );
}
