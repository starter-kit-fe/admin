import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import type { MenuParentOption } from './types';

interface MenuParentTreeSelectProps {
  options: MenuParentOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function formatOptionLabel(option: MenuParentOption) {
  const parts = option.label.split(/^(?<indent>[—\s]*)\s*/);
  if (parts.length >= 3) {
    const indent = parts[1] ?? '';
    const text = option.label.slice(indent.length).trim();
    return { indent, text };
  }
  return { indent: '', text: option.label };
}

export function MenuParentTreeSelect({
  options,
  value,
  onChange,
  disabled,
}: MenuParentTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLabel = useMemo(() => {
    const current = options.find((option) => option.value === value);
    return current ? current.label.replace(/^[—\s]+/, '') : '';
  }, [options, value]);

  const groupedOptions = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const filterOption = (option: MenuParentOption) => {
      if (!searchTerm) return true;
      const normalized = option.label.replace(/^[—\s]+/, '').toLowerCase();
      return normalized.includes(searchTerm);
    };
    return options.reduce(
      (acc, option) => {
        if (!filterOption(option)) {
          return acc;
        }
        if (option.value === '0') {
          acc.topLevel.push(option);
        } else {
          acc.nodes.push(option);
        }
        return acc;
      },
      { topLevel: [] as MenuParentOption[], nodes: [] as MenuParentOption[] },
    );
  }, [options, search]);

  const hasResults = groupedOptions.topLevel.length + groupedOptions.nodes.length > 0;

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
            {selectedLabel || '请选择父级菜单'}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b border-border/60 px-3">
            <Search className="mr-2 size-4 text-muted-foreground" />
            <CommandInput
              placeholder="搜索菜单名称"
              className="h-9"
              value={search}
              onValueChange={setSearch}
            />
          </div>
          <CommandList>
            {hasResults ? (
              <ScrollArea className="max-h-72">
                {groupedOptions.topLevel.length > 0 ? (
                  <CommandGroup heading="顶级">
                    {groupedOptions.topLevel.map((option) => {
                      const { text } = formatOptionLabel(option);
                      const selected = option.value === value;
                      return (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          className="flex items-center gap-2"
                          onSelect={() => {
                            onChange(option.value);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'size-4 text-primary',
                              selected ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="truncate">{text}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ) : null}
                {groupedOptions.nodes.length > 0 ? (
                  <CommandGroup heading="菜单树">
                    {groupedOptions.nodes.map((option) => {
                      const { indent, text } = formatOptionLabel(option);
                      const selected = option.value === value;
                      return (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          className="flex items-center gap-2"
                          onSelect={() => {
                            onChange(option.value);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'size-4 text-primary',
                              selected ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="whitespace-pre text-muted-foreground/80">{indent}</span>
                          <span className="truncate">{text}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ) : null}
              </ScrollArea>
            ) : (
              <CommandEmpty>未找到匹配的菜单</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
