import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type StatusTabItem = {
  value: string;
  label: string;
  count?: number | null;
  activeColor?: string;
};

interface StatusTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: StatusTabItem[];
}

export function StatusTabs({ value, onValueChange, tabs }: StatusTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList className="bg-transparent h-auto gap-1 px-0 py-0 overflow-x-auto border-b border-border/60">
        {tabs.map((tab) => {
          const isActive = tab.value === value;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'rounded-none border-b-2 border-transparent px-0 pb-3 pt-2 font-medium text-muted-foreground transition-colors data-[state=active]:text-foreground',
                isActive && 'border-foreground text-foreground',
              )}
            >
              <span className="flex items-center gap-2 text-sm">
                {tab.label}
                {typeof tab.count === 'number' ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'rounded-full px-2 py-0 text-xs font-medium',
                      isActive && tab.activeColor,
                    )}
                  >
                    {tab.count}
                  </Badge>
                ) : null}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
