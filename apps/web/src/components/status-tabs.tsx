import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusTabItem = {
  value: string
  label: string
  count?: number | null
  activeColor?: string
}

type StatusTabsProps = {
  value: string
  onValueChange: (value: string) => void
  tabs: ReadonlyArray<StatusTabItem>
}

export function StatusTabs({ value, onValueChange, tabs }: StatusTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList>
        {tabs.map((tab) => {
          const isActive = tab.value === value

          return (
            <TabsTrigger key={tab.value} value={tab.value}>
              <span className="flex items-center gap-2 text-sm">
                {tab.label}
                {typeof tab.count === "number" ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-full px-2 py-0 text-xs font-medium",
                      isActive && tab.activeColor
                    )}
                  >
                    {tab.count}
                  </Badge>
                ) : null}
              </span>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
