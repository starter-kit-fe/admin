'use client';

import { useMemo } from 'react';

import { STATUS_TABS } from '../constants';
import {
  useDepartmentManagementStore,
  type StatusValue,
} from '@/app/dashboard/system/dept/store';
import { DepartmentFilters } from './department-filters';

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

  return (
    <DepartmentFilters
      status={status}
      tabs={statusTabs}
      onStatusChange={handleStatusChange}
      keyword={keyword}
      onKeywordChange={handleKeywordChange}
    />
  );
}
