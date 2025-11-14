'use client';

import { StatusTabs } from '@/components/status-tabs';
import { Card } from '@/components/ui/card';

import { NoticeAppliedFilters, type FilterChip } from './notice-applied-filters';
import { NoticeFiltersBar } from './notice-filters-bar';

interface NoticeManagementFiltersProps {
  status: string;
  statusTabs: {
    value: string;
    label: string;
    activeColor?: string;
  }[];
  onStatusChange: (value: string) => void;
  keyword: string;
  onKeywordChange: (value: string) => void;
  noticeType: string;
  noticeTypeOptions: { value: string; label: string }[];
  onNoticeTypeChange: (value: string) => void;
  appliedFilters: FilterChip[];
  onRemoveFilter: (key: string) => void;
  onResetFilters: () => void;
}

export function NoticeManagementFilters({
  status,
  statusTabs,
  onStatusChange,
  keyword,
  onKeywordChange,
  noticeType,
  noticeTypeOptions,
  onNoticeTypeChange,
  appliedFilters,
  onRemoveFilter,
  onResetFilters,
}: NoticeManagementFiltersProps) {
  return (
    <Card className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-none sm:p-5">
      <div className="flex flex-col gap-4">
        <StatusTabs
          value={status}
          onValueChange={onStatusChange}
          tabs={statusTabs}
        />

        <NoticeFiltersBar
          keyword={keyword}
          onKeywordChange={onKeywordChange}
          noticeType={noticeType}
          noticeTypeOptions={noticeTypeOptions}
          onNoticeTypeChange={onNoticeTypeChange}
        />

        <NoticeAppliedFilters
          items={appliedFilters}
          onRemove={onRemoveFilter}
          onClear={onResetFilters}
        />
      </div>
    </Card>
  );
}

export type { FilterChip } from './notice-applied-filters';
