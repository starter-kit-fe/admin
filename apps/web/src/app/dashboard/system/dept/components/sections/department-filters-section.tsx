'use client';

import { useMemo } from 'react';

import { STATUS_TABS } from '../../constants';
import {
  useDepartmentManagementStore,
  type StatusValue,
} from '@/app/dashboard/system/dept/store';
import { DepartmentAppliedFilters } from '../filters/department-applied-filters';
import { DepartmentFilters } from '../filters/department-filters';

export function DepartmentFiltersSection() {
  const { status, setStatus, keyword, setKeyword } =
    useDepartmentManagementStore();

  const statusTabs = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        value: tab.value,
        label: tab.label,
      })),
    [],
  );

  const handleStatusChange = (value: string) => {
    setStatus(value as StatusValue);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
  };

  const trimmedKeyword = keyword.trim();

  return (
    <div className="flex flex-col gap-3">
      <DepartmentFilters
        status={status}
        tabs={statusTabs}
        onStatusChange={handleStatusChange}
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
      />
      <DepartmentAppliedFilters
        keyword={trimmedKeyword}
        onClearKeyword={() => setKeyword('')}
        onClearAll={() => setKeyword('')}
      />
    </div>
  );
}
