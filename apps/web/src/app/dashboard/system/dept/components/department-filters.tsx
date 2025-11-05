import { StatusTabs, type StatusTabItem } from '@/components/status-tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface DepartmentFiltersProps {
  status: string;
  tabs: StatusTabItem[];
  onStatusChange: (value: string) => void;
  keyword: string;
  onKeywordChange: (value: string) => void;
}

export function DepartmentFilters({
  status,
  tabs,
  onStatusChange,
  keyword,
  onKeywordChange,
}: DepartmentFiltersProps) {
  return (
    <Card className="rounded-xl border border-border/60 bg-card p-4 shadow-sm dark:border-border/40 sm:p-5">
      <div className="flex flex-col gap-4">
        <StatusTabs value={status} onValueChange={onStatusChange} tabs={tabs} />
        <Input
          placeholder="搜索部门名称"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          className="sm:max-w-sm"
        />
      </div>
    </Card>
  );
}
