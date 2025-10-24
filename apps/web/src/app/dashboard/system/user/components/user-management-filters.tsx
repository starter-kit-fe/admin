import { AppliedFilters } from './applied-filters';
import {
  FiltersBar,
  type FiltersFormState,
  type RoleOption,
} from './filters-bar';
import { StatusTabs } from './status-tabs';

export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface StatusTabMeta {
  value: string;
  label: string;
  count: number;
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
}: UserManagementFiltersProps) {
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
