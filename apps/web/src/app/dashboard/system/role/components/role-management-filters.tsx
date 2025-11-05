import { StatusTabs, type StatusTabItem } from '@/components/status-tabs';
import { Input } from '@/components/ui/input';

interface RoleManagementFiltersProps {
  status: string;
  onStatusChange: (value: string) => void;
  keyword: string;
  onKeywordChange: (value: string) => void;
  statusTabs: StatusTabItem[];
}

export function RoleManagementFilters({
  status,
  onStatusChange,
  keyword,
  onKeywordChange,
  statusTabs,
}: RoleManagementFiltersProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm dark:border-border/40">
      <StatusTabs value={status} onValueChange={onStatusChange} tabs={statusTabs} />
      <Input
        placeholder="搜索角色名称或权限字符"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        className="sm:max-w-sm"
      />
    </div>
  );
}
