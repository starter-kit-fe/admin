'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { STATUS_TABS } from '../constants';
import {
  useRoleManagementStore,
  type StatusValue,
} from '@/app/dashboard/system/role/store';
import { RoleManagementFilters } from './role-management-filters';

export function RoleFiltersSection() {
  const {
    status,
    setStatus,
    filterForm,
    setFilterForm,
    appliedFilters,
    applyFilters,
    statusCounts,
  } = useRoleManagementStore();

  const keywordDebounceRef = useRef<number | null>(null);

  const clearKeywordDebounce = useCallback(() => {
    if (keywordDebounceRef.current) {
      window.clearTimeout(keywordDebounceRef.current);
      keywordDebounceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearKeywordDebounce();
    };
  }, [clearKeywordDebounce]);

  const statusTabs = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        value: tab.value,
        label: tab.label,
        count: statusCounts[tab.value as StatusValue],
      })),
    [statusCounts],
  );

  const handleStatusChange = (value: string) => {
    setStatus(value as StatusValue);
  };

  const handleKeywordChange = (keyword: string) => {
    setFilterForm({ keyword });
    clearKeywordDebounce();
    keywordDebounceRef.current = window.setTimeout(() => {
      applyFilters({ keyword });
    }, 400);
  };

  useEffect(() => {
    if (appliedFilters.keyword === '') {
      setFilterForm({ keyword: '' });
    }
  }, [appliedFilters.keyword, setFilterForm]);

  return (
    <RoleManagementFilters
      status={status}
      onStatusChange={handleStatusChange}
      keyword={filterForm.keyword}
      onKeywordChange={handleKeywordChange}
      statusTabs={statusTabs}
    />
  );
}
