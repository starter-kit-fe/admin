'use client';

import { StatusTabs } from '@/components/status-tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('UserManagement.filters');
  if (variant === 'mobile') {
    return (
      <Card className="flex shadow-none flex-col gap-3">
        {titleSlot || refreshSlot ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              {titleSlot ?? (
                <span className="text-base font-semibold text-foreground">
                  {t('title')}
                </span>
              )}
            </div>
            {refreshSlot ?? null}
          </div>
        ) : null}

        <div className="-mx-1 overflow-x-auto pb-1">
          <StatusTabs
            value={status}
            onValueChange={onStatusChange}
            tabs={statusTabs}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={filterForm.keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-11 rounded-2xl border-border/60 pl-10 text-base"
            />
          </div>
          {actionSlot ?? null}
        </div>

        <div>
          <Select value={filterForm.role} onValueChange={onRoleChange}>
            <SelectTrigger className="h-11 w-full rounded-2xl border-border/60">
              <SelectValue placeholder={t('rolePlaceholder')} />
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
      </Card>
    );
  }

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
