import { StatusTabs } from '@/components/status-tabs';
import { Card } from '@/components/ui/card';
import type { ReactNode } from 'react';

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
  return (
    <Card className="rounded-xl border border-border/60 bg-background/80 shadow-none p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <StatusTabs
          value={status}
          onValueChange={onStatusChange}
          tabs={statusTabs}
        />

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
    </Card>
  );
}
