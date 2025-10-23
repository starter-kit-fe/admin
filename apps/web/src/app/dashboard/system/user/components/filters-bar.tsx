import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
  onChange: (value: FiltersFormState) => void;
  onSubmit: () => void;
  onReset: () => void;
  roleOptions: RoleOption[];
  loading?: boolean;
}

export function FiltersBar({ value, onChange, onSubmit, onReset, roleOptions, loading }: FiltersBarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-[260px,1fr] lg:grid-cols-[280px,1fr,auto]">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">角色</Label>
          <Select
            value={value.role}
            onValueChange={(role) => onChange({ ...value, role })}
          >
            <SelectTrigger className="h-11 rounded-lg border-muted">
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

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">关键字</Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              placeholder="请输入用户名或昵称"
              value={value.keyword}
              onChange={(event) =>
                onChange({ ...value, keyword: event.target.value })
              }
              className="h-11 rounded-lg border-muted pl-9"
            />
          </div>
        </div>

        <div className="flex items-end justify-start gap-2 lg:justify-end">
          <Button type="button" onClick={onSubmit} disabled={loading}>
            查询
          </Button>
          <Button type="button" variant="outline" onClick={onReset} disabled={loading}>
            重置
          </Button>
        </div>
      </div>
    </div>
  );
}
