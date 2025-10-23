import { X, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterChip = {
  key: string;
  label: string;
  value: string;
};

interface AppliedFiltersProps {
  items: FilterChip[];
  onRemove: (key: string) => void;
  onClear: () => void;
}

export function AppliedFilters({ items, onRemove, onClear }: AppliedFiltersProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 px-4 py-3">
      {items.map((item) => (
        <Badge
          key={item.key}
          variant="secondary"
          className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-foreground shadow-sm"
        >
          <span className="font-medium text-muted-foreground">{item.label}：</span>
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
        variant="link"
        className="text-destructive inline-flex items-center gap-1 px-0 text-sm"
        onClick={onClear}
      >
        <Trash2 className="size-4" /> 清除
      </Button>
    </div>
  );
}
