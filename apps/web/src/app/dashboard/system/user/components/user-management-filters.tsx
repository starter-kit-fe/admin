import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

import { StatusTabs } from '@/components/status-tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AppliedFilters } from './applied-filters';
import {
  FiltersBar,
  type FiltersFormState,
  type RoleOption,
} from './filters-bar';

export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface StatusTabMeta {
  value: string;
  label: string;
  count?: number;
  activeColor: string;
}

interface UserManagementFiltersProps {
  status: string;
  statusTabs: StatusTabMeta[];
  onStatusChange: (value: string) => void;
  filterForm: FiltersFormState;
  onRoleChange: (role: string) => void;
  onKeywordChange: (keyword: string) => void;
  roleOptions: RoleOption[];
  appliedFilters: FilterChip[];
  onRemoveFilter: (key: string) => void;
  onResetFilters: () => void;
  variant?: 'panel' | 'mobile';
  actionSlot?: ReactNode;
  titleSlot?: ReactNode;
  refreshSlot?: ReactNode;
}

export function UserManagementFilters({
  status,
  statusTabs,
  onStatusChange,
  filterForm,
  onRoleChange,
  onKeywordChange,
  roleOptions,
  appliedFilters,
  onRemoveFilter,
  onResetFilters,
  variant = 'panel',
  actionSlot,
  titleSlot,
  refreshSlot,
}: UserManagementFiltersProps) {
  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-3 rounded-[28px] bg-transparent pb-2 pt-1">
        {titleSlot || refreshSlot ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              {titleSlot ?? (
                <span className="text-base font-semibold text-foreground">筛选</span>
              )}
            </div>
            {refreshSlot ?? null}
          </div>
        ) : null}

        <div className="-mx-1 overflow-x-auto pb-1">
          <StatusTabs value={status} onValueChange={onStatusChange} tabs={statusTabs} />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={filterForm.keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="搜索用户或昵称"
              className="h-11 rounded-2xl border-border/60 pl-10 text-base"
            />
          </div>
          {actionSlot ?? null}
        </div>

        <div>
          <Select value={filterForm.role} onValueChange={onRoleChange}>
            <SelectTrigger className="h-11 w-full rounded-2xl border-border/60">
              <SelectValue placeholder="选择角色" />
            </SelectTrigger>
            <SelectContent align="start" className="min-w-[12rem] rounded-2xl">
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AppliedFilters
          items={appliedFilters}
          onRemove={onRemoveFilter}
          onClear={onResetFilters}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4">
        <StatusTabs value={status} onValueChange={onStatusChange} tabs={statusTabs} />

        <FiltersBar
          value={filterForm}
          onRoleChange={onRoleChange}
          onKeywordChange={onKeywordChange}
          roleOptions={roleOptions}
        />

        <AppliedFilters
          items={appliedFilters}
          onRemove={onRemoveFilter}
          onClear={onResetFilters}
        />
      </div>
    </div>
  );
}
