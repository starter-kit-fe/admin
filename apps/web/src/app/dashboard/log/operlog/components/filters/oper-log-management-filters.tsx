import { StatusTabs, type StatusTabItem } from '@/components/status-tabs';
import { Card } from '@/components/ui/card';

import type {
  OperLogBusinessTypeValue,
  OperLogRequestMethodValue,
  OperLogStatusValue,
} from '../../store';
import { OperLogAppliedFilters, type FilterChip } from './oper-log-applied-filters';
import {
  OperLogFiltersBar,
  type OperLogFiltersBarValue,
} from './oper-log-filters-bar';

interface OperLogManagementFiltersProps {
  status: OperLogStatusValue;
  statusTabs: ReadonlyArray<StatusTabItem>;
  onStatusChange: (value: OperLogStatusValue) => void;
  filters: OperLogFiltersBarValue;
  onTitleChange: (value: string) => void;
  onOperNameChange: (value: string) => void;
  onBusinessTypeChange: (value: OperLogBusinessTypeValue) => void;
  onRequestMethodChange: (value: OperLogRequestMethodValue) => void;
  businessTypeOptions: ReadonlyArray<{
    value: OperLogBusinessTypeValue;
    label: string;
  }>;
  requestMethodOptions: ReadonlyArray<{
    value: OperLogRequestMethodValue;
    label: string;
  }>;
  appliedFilters: FilterChip[];
  onRemoveFilter: (key: string) => void;
  onResetFilters: () => void;
}

export function OperLogManagementFilters({
  status,
  statusTabs,
  onStatusChange,
  filters,
  onTitleChange,
  onOperNameChange,
  onBusinessTypeChange,
  onRequestMethodChange,
  businessTypeOptions,
  requestMethodOptions,
  appliedFilters,
  onRemoveFilter,
  onResetFilters,
}: OperLogManagementFiltersProps) {
  return (
    <Card className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-none sm:p-5">
      <div className="flex flex-col gap-4">
        <StatusTabs
          value={status}
          onValueChange={(value) => onStatusChange(value as OperLogStatusValue)}
          tabs={statusTabs}
        />

        <OperLogFiltersBar
          value={filters}
          onTitleChange={onTitleChange}
          onOperNameChange={onOperNameChange}
          onBusinessTypeChange={onBusinessTypeChange}
          onRequestMethodChange={onRequestMethodChange}
          businessTypeOptions={businessTypeOptions}
          requestMethodOptions={requestMethodOptions}
        />

        <OperLogAppliedFilters
          items={appliedFilters}
          onRemove={onRemoveFilter}
          onClear={onResetFilters}
        />
      </div>
    </Card>
  );
}

export type { FilterChip } from './oper-log-applied-filters';
