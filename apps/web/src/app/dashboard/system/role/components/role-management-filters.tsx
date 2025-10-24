import { Input } from '@/components/ui/input';

import { StatusTabs, type StatusTabItem } from '../../user/components/status-tabs';

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
    <div className="space-y-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm">
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
