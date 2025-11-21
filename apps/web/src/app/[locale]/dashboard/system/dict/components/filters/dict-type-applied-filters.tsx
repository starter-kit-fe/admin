import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DictTypeAppliedFiltersProps {
  dictName: string;
  dictType: string;
  onRemove: (key: 'dictName' | 'dictType') => void;
  onClear: () => void;
}

export function DictTypeAppliedFilters({
  dictName,
  dictType,
  onRemove,
  onClear,
}: DictTypeAppliedFiltersProps) {
  const t = useTranslations('DictManagement');
  const chips = [] as Array<{ key: 'dictName' | 'dictType'; label: string; value: string }>;
  if (dictName.trim()) {
    chips.push({
      key: 'dictName',
      label: t('typeFilters.chips.dictName'),
      value: dictName.trim(),
    });
  }
  if (dictType.trim()) {
    chips.push({
      key: 'dictType',
      label: t('typeFilters.chips.dictType'),
      value: dictType.trim(),
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
            onClick={() => onRemove(chip.key)}
            className={cn('text-muted-foreground/70 transition-colors hover:text-muted-foreground')}
            aria-label={t('typeFilters.chips.remove', { target: chip.label })}
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
        <Trash2 className="size-4" /> {t('typeFilters.clearAll')}
      </Button>
    </div>
  );
}
