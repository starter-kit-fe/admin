import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2, X } from 'lucide-react';

export type OnlineFilterChip = {
  key: 'userName' | 'ipaddr';
  label: string;
  value: string;
};

interface OnlineAppliedFiltersProps {
  items: OnlineFilterChip[];
  onRemove: (key: OnlineFilterChip['key']) => void;
  onClear: () => void;
}

export function OnlineAppliedFilters({
  items,
  onRemove,
  onClear,
}: OnlineAppliedFiltersProps) {
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
            {item.label}：
          </span>
          <span className="text-foreground">{item.value}</span>
          <button
            type="button"
            onClick={() => onRemove(item.key)}
            className={cn(
              'text-muted-foreground/70 transition-colors hover:text-muted-foreground',
            )}
            aria-label={`移除 ${item.label}`}
          >
            <X className="size-3.5" />
          </button>
        </Badge>
      ))}
      <Button
        type="button"
        variant="destructive"
        className=""
        onClick={onClear}
      >
        <Trash2 className="size-4" /> 清除
      </Button>
    </div>
  );
}
