'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, RefreshCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { STATUS_TABS } from '../../constants';
import {
  useUserManagementRefresh,
  useUserManagementStatus,
  useUserManagementStore,
  type StatusValue,
} from '../../store';
import { DEFAULT_ROLE_VALUE } from '../utils';
import {
  UserManagementFilters,
  type FilterChip,
} from '../filters/user-management-filters';

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
    openCreate,
  } = useUserManagementStore();
  const { isRefreshing, isMutating } = useUserManagementStatus();
  const refresh = useUserManagementRefresh();
  const isMobile = useIsMobile();
  const refreshDisabled = isMutating || isRefreshing;

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
        activeColor: tab.color,
      })),
    [],
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

  const mobileTitleSlot = isMobile ? (
    <span className="text-lg font-semibold text-foreground">用户管理</span>
  ) : undefined;

  const mobileActionSlot = isMobile ? (
    <Button
      type="button"
      size="sm"
      className="shrink-0 rounded-2xl px-3 font-semibold"
      onClick={() => openCreate()}
      disabled={isMutating}
    >
      <Plus className="mr-1.5 size-4" />
      新增
    </Button>
  ) : undefined;

  const mobileRefreshSlot = isMobile ? (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label="刷新用户列表"
      className="size-9 shrink-0 rounded-full border border-border/60 bg-background/70"
      onClick={() => refresh()}
      disabled={refreshDisabled}
    >
      {isRefreshing ? <Spinner className="size-4" /> : <RefreshCcw className="size-4" />}
    </Button>
  ) : undefined;

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
      variant={isMobile ? 'mobile' : 'panel'}
      actionSlot={mobileActionSlot}
      titleSlot={mobileTitleSlot}
      refreshSlot={mobileRefreshSlot}
    />
  );
}
