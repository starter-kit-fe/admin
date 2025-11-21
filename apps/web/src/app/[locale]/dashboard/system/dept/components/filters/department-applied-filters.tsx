import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2, X } from 'lucide-react';

import { STATUS_TABS } from '../../constants';
import { useTranslations } from 'next-intl';

interface DepartmentAppliedFiltersProps {
  keyword: string;
  status: string;
  onClearKeyword: () => void;
  onClearStatus: () => void;
  onClearAll: () => void;
}

export function DepartmentAppliedFilters({
  keyword,
  status,
  onClearKeyword,
  onClearStatus,
  onClearAll,
}: DepartmentAppliedFiltersProps) {
  const t = useTranslations('DepartmentManagement');
  const chips: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];
  const trimmedKeyword = keyword.trim();
  if (trimmedKeyword) {
    chips.push({
      key: 'keyword',
      label: t('filters.chips.keyword'),
      value: trimmedKeyword,
      onRemove: onClearKeyword,
    });
  }
  if (status !== 'all') {
    const statusMeta = STATUS_TABS.find((tab) => tab.value === status);
    chips.push({
      key: 'status',
      label: t('filters.chips.status'),
      value: statusMeta ? t(statusMeta.labelKey) : status,
      onRemove: onClearStatus,
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 px-4 py-3">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="flex items-center gap-2 rounded-full px-3 py-1 text-sm dark:bg-secondary/30 dark:text-secondary-foreground"
        >
          <span className="font-medium text-muted-foreground">
            {chip.label}：
          </span>
          <span className="text-foreground">{chip.value}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className={cn('text-muted-foreground/70 transition-colors hover:text-muted-foreground')}
            aria-label={t('filters.chips.remove', { target: chip.label })}
          >
            <X className="size-3.5" />
          </button>
        </Badge>
      ))}
      <Button
        type="button"
        variant="link"
        className="inline-flex items-center gap-1 px-0 text-sm text-destructive hover:text-destructive dark:text-destructive dark:hover:text-destructive/80"
        onClick={onClearAll}
      >
        <Trash2 className="size-4" /> {t('filters.clearAll')}
      </Button>
    </div>
  );
}
