import { StatusTabs, type StatusTabItem } from '@/components/status-tabs';
import { Input } from '@/components/ui/input';

interface PostManagementFiltersProps {
  status: string;
  tabs: StatusTabItem[];
  onStatusChange: (value: string) => void;
  postName: string;
  onPostNameChange: (value: string) => void;
  disabled?: boolean;
}

export function PostManagementFilters({
  status,
  tabs,
  onStatusChange,
  postName,
  onPostNameChange,
  disabled = false,
}: PostManagementFiltersProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4">
        <StatusTabs value={status} onValueChange={onStatusChange} tabs={tabs} />

        <Input
          placeholder="岗位名称"
          value={postName}
          onChange={(event) => onPostNameChange(event.target.value)}
          disabled={disabled}
          className="sm:max-w-sm"
        />
      </div>
    </div>
  );
}
