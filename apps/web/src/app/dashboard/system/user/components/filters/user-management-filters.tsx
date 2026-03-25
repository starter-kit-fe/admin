import { StatusTabs } from '@/components/status-tabs';
import { Card } from '@repo/ui/components/card';
import { cn } from '@/lib/utils';
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
  const hasToolbar = Boolean(titleSlot || refreshSlot || actionSlot);

  return (
    <Card
      className={cn(
        'rounded-xl border border-border/60 bg-background/80 p-4 shadow-none sm:p-5',
        variant === 'mobile' && 'rounded-2xl',
      )}
    >
      <div className="flex flex-col gap-4">
        {hasToolbar ? (
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-3',
              variant === 'mobile' && 'sm:hidden',
            )}
          >
            <div className="min-w-0 flex-1">{titleSlot}</div>
            <div className="flex items-center gap-2">
              {refreshSlot}
              {actionSlot}
            </div>
          </div>
        ) : null}
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
