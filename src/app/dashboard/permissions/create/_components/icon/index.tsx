'use client';

import React, { LegacyRef, useState } from 'react';
import { Button } from '@/components/ui/button';
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandList,
// } from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { IconCard } from './card';
// import { icons } from 'lucide-react';
// import { useDebounce } from '../../../_hook';
// import { IconItemWithIntersection } from './icon-with-intersection';

interface IconGalleryProps {
  value: string;
  onChange: (val: string) => void;
}
export const IconGallery = React.forwardRef(
  ({ value }: IconGalleryProps, ref: LegacyRef<HTMLButtonElement>) => {
    const [open, setOpen] = useState(false);
    // const [searchTerm] = useState('');
    // const [iconSize] = useState(24);

    // const debouncedSearchTerm = useDebounce(searchTerm, 200);

    // const iconNames = useMemo(() => {
    //   return Object.keys(icons).filter((name) =>
    //     name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    //   );
    // }, [debouncedSearchTerm]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            size="sm"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value ? (
              <IconCard iconName={value as keyof typeof dynamicIconImports} />
            ) : (
              <div className="text-muted-foreground"> 请选择图标</div>
            )}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[90vw] md:w-[40vw] p-0">
          {/* <Command>
            <CommandInput
              placeholder="搜索图标"
              value={searchTerm}
              onInput={(e: FormEvent<HTMLInputElement>) =>
                setSearchTerm(e.currentTarget.value)
              }
              className="w-full sm:w-1/2"
            />
            <CommandList>
              <CommandEmpty>数据为空.</CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-y-auto">
                <div className="grid grid-cols-6 md:grid-cols-8 gap-1 p-2 place-items-center">
                  {iconNames.map((it, index) => (
                    <IconItemWithIntersection
                      key={it}
                      iconName={it}
                      index={index}
                      iconSize={iconSize}
                      onSelect={(name) => {
                        // TODO: Implement selection logic
                        setOpen(false);
                        onChange(name);
                      }}
                    />
                  ))}
                </div>
              </CommandGroup>
            </CommandList>
          </Command> */}
        </PopoverContent>
      </Popover>
    );
  }
);
IconGallery.displayName = 'icon-gallery';
