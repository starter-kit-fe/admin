'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { STATUS_TABS } from '../constants';
import { useUserManagementStore, type StatusValue } from '../store';
import { DEFAULT_ROLE_VALUE } from './utils';
import {
  UserManagementFilters,
  type FilterChip,
} from './user-management-filters';

export function UserFiltersSection() {
  const {
    status,
    setStatus,
    filterForm,
    setFilterForm,
    appliedFilters,
    applyFilters,
    resetFilters,
    roleOptions,
    statusCounts,
  } = useUserManagementStore();

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
        count: statusCounts[tab.value],
        activeColor: tab.color,
      })),
    [statusCounts],
  );

  const appliedFilterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (appliedFilters.role !== DEFAULT_ROLE_VALUE) {
      const roleLabel =
        roleOptions.find((option) => option.value === appliedFilters.role)
          ?.label ?? appliedFilters.role;
      chips.push({
        key: 'role',
        label: '角色',
        value: roleLabel,
      });
    }
    if (appliedFilters.keyword) {
      chips.push({
        key: 'keyword',
        label: '关键字',
        value: appliedFilters.keyword,
      });
    }
    return chips;
  }, [appliedFilters, roleOptions]);

  const handleRoleChange = (role: string) => {
    clearKeywordDebounce();
    const next = { ...filterForm, role };
    setFilterForm(next);
    applyFilters(next);
  };

  const handleKeywordChange = (keyword: string) => {
    const next = { ...filterForm, keyword };
    setFilterForm(next);
    clearKeywordDebounce();
    keywordDebounceRef.current = window.setTimeout(() => {
      applyFilters(next);
    }, 400);
  };

  const handleRemoveFilter = (key: string) => {
    clearKeywordDebounce();
    if (key === 'role') {
      const nextFilters = {
        role: DEFAULT_ROLE_VALUE,
        keyword: appliedFilters.keyword,
      };
      setFilterForm((prev) => ({ ...prev, role: DEFAULT_ROLE_VALUE }));
      applyFilters(nextFilters, { force: true });
      return;
    }
    if (key === 'keyword') {
      const nextFilters = {
        role: appliedFilters.role,
        keyword: '',
      };
      setFilterForm((prev) => ({ ...prev, keyword: '' }));
      applyFilters(nextFilters, { force: true });
    }
  };

  const handleResetFilters = () => {
    clearKeywordDebounce();
    resetFilters();
  };

  return (
    <UserManagementFilters
      status={status}
      statusTabs={statusTabs}
      onStatusChange={(value) => setStatus(value as StatusValue)}
      filterForm={filterForm}
      onRoleChange={handleRoleChange}
      onKeywordChange={handleKeywordChange}
      roleOptions={roleOptions}
      appliedFilters={appliedFilterChips}
      onRemoveFilter={handleRemoveFilter}
      onResetFilters={handleResetFilters}
    />
  );
}
