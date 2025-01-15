'use client';

import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useParentList } from '../../_hook';
import Show from '@/components/show';
import Loading from '@/app/dashboard/loading';
import React, { LegacyRef, useMemo, useState } from 'react';

interface ParentSelectedProps {
  value: number;
  type: number;
  onChange: (val: number | null) => void;
}
export const ParentSeleted = React.forwardRef(
  ({ value, type }: ParentSelectedProps, ref: LegacyRef<HTMLButtonElement>) => {
    const { data, isLoading } = useParentList(type);
    const [q] = useState('');
    const list = useMemo(() => {
      if (!data) return [{ id: 0, name: '根节点' }];
      return data.filter((it) => it.name.includes(q));
    }, [q, data]);
    const currentVal = useMemo(() => {
      return list.find((it) => it.id === value)?.name || '请选择父节点';
    }, [list, value]);

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            ref={ref}
            size="sm"
            disabled={isLoading}
            className={cn(
              ' w-full justify-between',
              !value && 'text-muted-foreground'
            )}
          >
            <Show when={!isLoading} fallback={<Loading />}>
              {currentVal}
            </Show>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          {/* <Command className="w-full">
            <CommandInput
              value={q}
              onInput={(e: FormEvent<HTMLInputElement>) =>
                setQ(e.currentTarget.value)
              }
              placeholder="搜索父节点"
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>没有数据.</CommandEmpty>
              <CommandGroup>
                {list.map((it) => (
                  <CommandItem
                    value={`${it.id}`}
                    key={it.id}
                    onSelect={(e) => {
                      const val = value === Number(e) ? null : Number(e);
                      onChange(val);
                    }}
                  >
                    {it.name}
                    <Check
                      className={cn(
                        'ml-auto',
                        it.id === value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command> */}
        </PopoverContent>
      </Popover>
    );
  }
);
ParentSeleted.displayName = 'parent-seleted';
