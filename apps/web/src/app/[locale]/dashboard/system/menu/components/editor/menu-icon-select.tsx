'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  getLucideIconEntries,
  type LucideIconEntry,
} from '@/lib/lucide-icons';

interface MenuIconSelectProps {
  value?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
}

type IconEntry = LucideIconEntry & {
  category: string;
};

type IconCategory = {
  id: string;
  label: string;
  count: number;
};

const GRID_COLUMNS = 4;
// Matches card height (h-24) plus grid gap to keep virtualization accurate.
const ROW_HEIGHT = 104;
const OVERSCAN_ROWS = 6;

const RAW_ICON_ENTRIES = getLucideIconEntries();
const ICON_ENTRIES: IconEntry[] = RAW_ICON_ENTRIES.map((entry) => ({
  ...entry,
  category: categorizeIcon(entry.label),
}));
const ICON_MAP = new Map(
  ICON_ENTRIES.map((entry) => [entry.value.toLowerCase(), entry]),
);
const ICON_CATEGORIES: IconCategory[] = buildIconCategories(ICON_ENTRIES);

function categorizeIcon(label: string) {
  const initial = label.trim().charAt(0)?.toUpperCase() ?? '';
  if (initial >= 'A' && initial <= 'Z') {
    return initial;
  }
  return '#';
}

function formatCategoryLabel(category: string) {
  if (category === '#') {
    return '其他';
  }
  return category;
}

function buildIconCategories(entries: IconEntry[]): IconCategory[] {
  const counts = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.category] = (acc[entry.category] ?? 0) + 1;
    return acc;
  }, {});

  return [
    {
      id: 'all',
      label: '全部图标',
      count: entries.length,
    },
    ...Object.entries(counts)
      .sort(([a], [b]) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
      })
      .map(([id, count]) => ({
        id,
        label: formatCategoryLabel(id),
        count,
      })),
  ];
}

export function MenuIconSelect({
  value,
  placeholder = '选择图标',
  allowEmpty = true,
  disabled,
  onChange,
}: MenuIconSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const deferredQuery = useDeferredValue(query);
  const normalizedValue = value && value !== '#' ? value : '';
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(ROW_HEIGHT * 4);

  const selectedIcon = useMemo(() => {
    if (!normalizedValue) return undefined;
    return ICON_MAP.get(normalizedValue);
  }, [normalizedValue]);

  const filteredIcons = useMemo(() => {
    const keyword = deferredQuery.trim().toLowerCase();
    if (!keyword) {
      return ICON_ENTRIES.filter((entry) => activeCategory === 'all' || entry.category === activeCategory);
    }
    return ICON_ENTRIES.filter(
      (entry) =>
        entry.search.includes(keyword) &&
        (activeCategory === 'all' || entry.category === activeCategory),
    );
  }, [activeCategory, deferredQuery]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setViewportHeight(entry.contentRect.height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    container.scrollTop = 0;
    setScrollTop(0);
  }, [activeCategory, deferredQuery, open]);

  const totalRows = Math.ceil(filteredIcons.length / GRID_COLUMNS);
  const baseRow = Math.floor(scrollTop / ROW_HEIGHT);
  const startRow = Math.max(0, baseRow - OVERSCAN_ROWS);
  const visibleRowCount =
    Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN_ROWS * 2;
  const endRow = Math.min(totalRows, startRow + visibleRowCount);
  const startIndex = startRow * GRID_COLUMNS;
  const endIndex = Math.min(filteredIcons.length, endRow * GRID_COLUMNS);
  const paddingTop = startRow * ROW_HEIGHT;
  const paddingBottom = Math.max(totalRows * ROW_HEIGHT - endRow * ROW_HEIGHT, 0);
  const virtualIcons =
    startIndex >= endIndex ? [] : filteredIcons.slice(startIndex, endIndex);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
            {selectedIcon ? (
              <>
                <selectedIcon.Icon className="h-4 w-4" />
                <span className="truncate">{selectedIcon.label}</span>
              </>
            ) : normalizedValue ? (
              <span className="truncate">{normalizedValue}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[720px] max-w-[90vw] p-0">
        <div className="space-y-3 p-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索图标（支持拼音/英文）"
          />
          {allowEmpty ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-between',
                normalizedValue ? 'text-muted-foreground' : 'text-primary',
              )}
              onClick={() => handleSelect('')}
            >
              不使用图标
              <Check className={cn('h-4 w-4', normalizedValue ? 'opacity-0' : 'opacity-100')} />
            </Button>
          ) : null}
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span>共 {filteredIcons.length} 个匹配</span>
            <span>虚拟列表已开启</span>
          </div>
          {filteredIcons.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              没有匹配的图标
            </p>
          ) : (
            <div className="flex gap-3">
              <div className="w-40 shrink-0 rounded-md border border-border/60">
                <div className="h-[420px] overflow-auto py-1">
                  {ICON_CATEGORIES.map((category) => {
                    const isActive = activeCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition',
                          isActive
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                        onClick={() => setActiveCategory(category.id)}
                      >
                        <span>{category.label}</span>
                        <span className="text-xs text-muted-foreground">{category.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div
                ref={listRef}
                onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
                className="h-[420px] flex-1 overflow-auto rounded-md border border-border/60"
              >
                <div
                  className="grid grid-cols-4 gap-2 p-2 pr-3"
                  style={{
                    paddingTop,
                    paddingBottom,
                  }}
                >
                  {virtualIcons.map((entry) => {
                    const isActive = entry.value === normalizedValue;
                    return (
                      <button
                        key={entry.value}
                        type="button"
                        onClick={() => handleSelect(entry.value)}
                        className={cn(
                          'flex h-24 flex-col items-center justify-center gap-1 rounded-md border px-2 text-center transition hover:border-primary/80 hover:text-primary',
                          isActive
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border/80 text-muted-foreground',
                        )}
                      >
                        <entry.Icon className="h-5 w-5" />
                        <span className="line-clamp-2 min-h-[28px] break-words text-center text-[10px] leading-tight">
                          {entry.label}
                        </span>
                        <Check className={cn('h-4 w-4', isActive ? 'opacity-100' : 'opacity-0')} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
