'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export type PostFilterChip = {
  key: string;
  label: string;
  value: string;
};

interface AppliedFiltersProps {
  items: PostFilterChip[];
  onRemove: (key: string) => void;
}

export function AppliedFilters({ items, onRemove }: AppliedFiltersProps) {
  const locale = useLocale();
  const t = useTranslations('PostManagement.filters');
  const separator = locale === 'zh-Hans' ? '：' : ': ';

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 ">
      {items.map((item) => (
        <Badge
          key={item.key}
          variant="secondary"
          className="flex items-center gap-2 rounded-full px-3 py-1 text-sm "
        >
          <span className="font-medium text-muted-foreground">
            {item.label}
            {separator}
          </span>
          <span className="text-foreground">{item.value}</span>
          <button
            type="button"
            onClick={() => onRemove(item.key)}
            className={cn(
              'text-muted-foreground/70 transition-colors hover:text-muted-foreground',
            )}
            aria-label={t('chips.remove', { target: item.label })}
          >
            <X className="size-3.5" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
