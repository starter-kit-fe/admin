import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          角色
        </Label>
        <Select value={value.role} onValueChange={onRoleChange}>
          <SelectTrigger className="h-10 w-full flex-1 rounded-lg border-muted sm:w-48">
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

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          关键字
        </Label>
        <div className="relative w-full min-w-0 flex-1 sm:w-64">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="请输入用户名或昵称"
            value={value.keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            className="h-10 w-full rounded-lg border-muted pl-9"
          />
        </div>
      </div>
    </div>
  );
}
