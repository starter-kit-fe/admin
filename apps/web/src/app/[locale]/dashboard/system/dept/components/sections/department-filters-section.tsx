'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { STATUS_VALUES } from '../../constants';
import {
  type StatusValue,
  useDepartmentFilters,
} from '@/app/dashboard/system/dept/store';
import { DepartmentAppliedFilters } from '../filters/department-applied-filters';
import { DepartmentFilters } from '../filters/department-filters';

export function DepartmentFiltersSection() {
  const { status, setStatus, keyword, setKeyword } = useDepartmentFilters();
  const tStatus = useTranslations('DepartmentManagement.status');

  const statusTabs = useMemo(
    () =>
      STATUS_VALUES.map((value) => ({
        value,
        label: tStatus(value),
      })),
    [tStatus],
  );

  const handleStatusChange = (value: string) => {
    setStatus(value as StatusValue);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
  };

  const trimmedKeyword = keyword.trim();

  const handleClearStatus = () => setStatus('all');
  const handleClearAll = () => {
    setKeyword('');
    setStatus('all');
  };

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
        status={status}
        onClearKeyword={() => setKeyword('')}
        onClearStatus={handleClearStatus}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
