import { type StatusTabItem, StatusTabs } from '@/components/status-tabs';
import { Card } from '@/components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Search, X } from 'lucide-react';

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
    <Card className="shadow-none rounded-xl gap-3 sm:p-5 ">
      <StatusTabs
        value={status}
        onValueChange={onStatusChange}
        tabs={statusTabs}
      />

      <InputGroup className="w-[300px] border-muted bg-muted/60">
        <InputGroupAddon>
          <Search className="size-4 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="搜索角色名称或权限字符"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
        {keyword && (
          <InputGroupButton
            variant="ghost"
            size="icon-sm"
            aria-label="清空搜索"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onKeywordChange('')}
            disabled={!keyword}
          >
            <X className="size-3.5" />
          </InputGroupButton>
        )}
      </InputGroup>
    </Card>
  );
}
