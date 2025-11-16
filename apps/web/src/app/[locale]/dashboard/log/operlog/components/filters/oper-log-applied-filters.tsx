import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export type FilterChip = {
  key: string;
  label: string;
  value: string;
};

interface OperLogAppliedFiltersProps {
  items: FilterChip[];
  onRemove: (key: string) => void;
  onClear: () => void;
}

export function OperLogAppliedFilters({
  items,
  onRemove,
  onClear,
}: OperLogAppliedFiltersProps) {
  const locale = useLocale();
  const tFilters = useTranslations('OperLogManagement.filters');
  const separator = locale === 'zh-Hans' ? '：' : ': ';

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 px-4 py-3">
      {items.map((item) => (
        <Badge
          key={item.key}
          variant="secondary"
          className="flex items-center gap-2 rounded-full px-3 py-1 text-sm dark:bg-secondary/30 dark:text-secondary-foreground"
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
            aria-label={tFilters('chips.remove', { target: item.label })}
          >
            <X className="size-3.5" />
          </button>
        </Badge>
      ))}
      <Button
        type="button"
        variant="link"
        className="inline-flex items-center gap-1 px-0 text-sm text-destructive hover:text-destructive dark:text-destructive dark:hover:text-destructive/80"
        onClick={onClear}
      >
        <Trash2 className="size-4" /> {tFilters('actions.clear')}
      </Button>
    </div>
  );
}
