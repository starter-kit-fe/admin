import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

export type FiltersFormState = {
  role: string;
  keyword: string;
};

export type RoleOption = {
  label: string;
  value: string;
};

interface FiltersBarProps {
  value: FiltersFormState;
  onRoleChange: (role: string) => void;
  onKeywordChange: (keyword: string) => void;
  roleOptions: RoleOption[];
}

export function FiltersBar({
  value,
  onRoleChange,
  onKeywordChange,
  roleOptions,
}: FiltersBarProps) {
  const handleKeywordClear = () => {
    if (value.keyword) {
      onKeywordChange('');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <div className="w-full min-w-0 flex-1 sm:w-64">
          <InputGroup className="w-full border-muted bg-muted/60">
            <InputGroupAddon>
              <Search className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="请输入用户名或昵称"
              value={value.keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
            />
            {value.keyword && (
              <InputGroupButton
                variant="ghost"
                size="icon-sm"
                aria-label="清空搜索"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleKeywordClear}
                disabled={!value.keyword}
              >
                <X className="size-3.5" />
              </InputGroupButton>
            )}
          </InputGroup>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <Select value={value.role} onValueChange={onRoleChange}>
          <SelectTrigger className="h-10 w-full bg-muted flex-1 rounded-lg border-muted sm:w-48">
            <SelectValue placeholder="选择角色" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
