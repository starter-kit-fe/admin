'use client';

import {
  type StatusValue,
  useRoleManagementStore,
} from '@/app/dashboard/system/role/store';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { STATUS_TABS } from '../../constants';
import { RoleManagementFilters } from '../filters/role-management-filters';

export function RoleFiltersSection() {
  const {
    status,
    setStatus,
    filterForm,
    setFilterForm,
    appliedFilters,
    applyFilters,
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
      })),
    [],
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
