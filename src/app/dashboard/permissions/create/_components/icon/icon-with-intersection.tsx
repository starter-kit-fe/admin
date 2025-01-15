import Show from '@/components/show';
// import { CommandItem } from '@/components/ui/command';
import { useEffect, useRef, useState, memo } from 'react';
import { IconCard } from './card';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const IconItemWithIntersection = memo(
  ({
    iconName,
    // onSelect,
  }: {
    iconName: string;
    index: number;
    iconSize: number;
    onSelect: (val: string) => void;
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isIntersecting, setIntersecting] = useState(false);

    useEffect(() => {
      const intersectionObserver = new IntersectionObserver(
        (entrie) => {
          if (entrie[0].isIntersecting) {
            setIntersecting(true);
            intersectionObserver.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px 50px 0px',
        }
      );
      if (ref.current) intersectionObserver.observe(ref.current);
    }, []);
    return (
      // <CommandItem
      //   ref={ref}
      //   value={iconName}
      //   className=""
      //   onSelect={() => onSelect(iconName)}
      // >
      <Show
        when={isIntersecting ?? false} // Fallback to true to ensure initial render
        fallback={<div className="w-8 h-8 animate-pulse bg-gray-200 rounded" />}
      >
        <Tooltip>
          <TooltipTrigger>
            <div className="flex flex-col items-center p-1 rounded hover:bg-gray-100">
              <IconCard
                iconName={iconName as keyof typeof dynamicIconImports}
                size={32}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{iconName}</p>
          </TooltipContent>
        </Tooltip>
      </Show>
      // </CommandItem>
    );
  }
);
IconItemWithIntersection.displayName = 'icon-item-with-intersection';
