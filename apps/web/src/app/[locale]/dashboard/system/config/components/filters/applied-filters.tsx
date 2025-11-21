'use client';

import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type ConfigFilterKey = 'configName' | 'configKey';

export interface ConfigFilterChip {
  key: ConfigFilterKey;
  label: string;
  value: string;
}

interface ConfigAppliedFiltersProps {
  items: ConfigFilterChip[];
  onRemove: (key: ConfigFilterKey) => void;
}

export function ConfigAppliedFilters({
  items,
  onRemove,
}: ConfigAppliedFiltersProps) {
  const t = useTranslations('ConfigManagement');

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/50 px-4 py-3">
      {items.map((item) => (
        <Badge
          key={item.key}
          variant="secondary"
          className="flex items-center gap-2 rounded-full px-3 py-1 text-sm"
        >
          <span className="font-medium text-muted-foreground">
            {item.label}：
          </span>
          <span className="text-foreground">{item.value}</span>
          <button
            type="button"
            onClick={() => onRemove(item.key)}
            className="text-muted-foreground/70 transition-colors hover:text-foreground"
            aria-label={t('filters.removeAria', { target: item.label })}
          >
            <X className="size-3.5" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
