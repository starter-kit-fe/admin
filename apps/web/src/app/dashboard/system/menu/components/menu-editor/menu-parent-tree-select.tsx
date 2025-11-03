'use client';

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

const INDENT_TOKEN = '—';

function buildIndent(level: number) {
  if (level <= 0) return '';
  return `${INDENT_TOKEN} `.repeat(level);
}

export function MenuParentTreeSelect({
  options,
  value,
  onChange,
  disabled,
}: MenuParentTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const trimmedSearch = search.trim();
  const normalizedSearch = trimmedSearch.toLowerCase();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const selectedLabel = useMemo(() => {
    if (!selectedOption) return '';
    if (selectedOption.value === '0') {
      return selectedOption.label;
    }
    return selectedOption.path.join(' / ');
  }, [selectedOption]);

  const groupedOptions = useMemo(() => {
    const filterOption = (option: MenuParentOption) => {
      if (!normalizedSearch) return true;
      const normalizedTarget = `${option.label} ${option.path.join(' ')}`.toLowerCase();
      return normalizedTarget.includes(normalizedSearch);
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
      {
        topLevel: [] as MenuParentOption[],
        nodes: [] as MenuParentOption[],
      },
    );
  }, [normalizedSearch, options]);

  const hasResults = groupedOptions.topLevel.length + groupedOptions.nodes.length > 0;

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const handleSelect = (option: MenuParentOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

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
                      const selected = option.value === value;
                      return (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          className={cn(
                            'flex items-center gap-2',
                            option.disabled && 'pointer-events-none opacity-50',
                          )}
                          onSelect={() => handleSelect(option)}
                        >
                          <Check
                            className={cn(
                              'size-4 text-primary',
                              selected ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="truncate">{option.label}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ) : null}
                {groupedOptions.nodes.length > 0 ? (
                  <CommandGroup heading="菜单树">
                    {groupedOptions.nodes.map((option) => {
                      const selected = option.value === value;
                      const indent = buildIndent(option.level);
                      return (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          className={cn(
                            'flex items-center gap-2',
                            option.disabled && 'pointer-events-none opacity-50',
                          )}
                          onSelect={() => handleSelect(option)}
                        >
                          <Check
                            className={cn(
                              'size-4 text-primary',
                              selected ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="whitespace-pre text-muted-foreground/70">{indent}</span>
                          <span className="truncate">{option.label}</span>
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
