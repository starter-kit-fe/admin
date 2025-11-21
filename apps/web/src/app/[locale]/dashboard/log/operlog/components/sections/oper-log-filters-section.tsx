'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  DEFAULT_DEBOUNCE_MS,
  OPER_LOG_BUSINESS_TYPE_OPTIONS,
  OPER_LOG_REQUEST_METHOD_OPTIONS,
  OPER_LOG_STATUS_TABS,
} from '../../constants';
import {
  type OperLogBusinessTypeValue,
  type OperLogFilterState,
  type OperLogRequestMethodValue,
  type OperLogStatusValue,
  useOperLogManagementStore,
} from '../../store';
import {
  OperLogManagementFilters,
  type FilterChip,
} from '../filters/oper-log-management-filters';

export function OperLogFiltersSection() {
  const { filterForm, setFilterForm, appliedFilters, applyFilters, resetFilters } =
    useOperLogManagementStore();
  const debounceRef = useRef<number | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearDebounce();
    };
  }, [clearDebounce]);

  const normalizeFilters = useCallback(
    (nextFilters: OperLogFilterState) => ({
      ...nextFilters,
      title: nextFilters.title.trim(),
      operName: nextFilters.operName.trim(),
    }),
    [],
  );

  const applyImmediately = useCallback(
    (nextFilters: OperLogFilterState) => {
      clearDebounce();
      applyFilters(normalizeFilters(nextFilters), { force: true });
    },
    [applyFilters, clearDebounce, normalizeFilters],
  );

  const scheduleApply = useCallback(
    (nextFilters: OperLogFilterState) => {
      clearDebounce();
      debounceRef.current = window.setTimeout(() => {
        applyFilters(normalizeFilters(nextFilters));
      }, DEFAULT_DEBOUNCE_MS);
    },
    [applyFilters, clearDebounce, normalizeFilters],
  );

  const handleTitleChange = (value: string) => {
    const next = { ...filterForm, title: value };
    setFilterForm(next);
    scheduleApply(next);
  };

  const handleOperNameChange = (value: string) => {
    const next = { ...filterForm, operName: value };
    setFilterForm(next);
    scheduleApply(next);
  };

  const handleBusinessTypeChange = (value: OperLogBusinessTypeValue) => {
    const next = { ...filterForm, businessType: value };
    setFilterForm(next);
    applyImmediately(next);
  };

  const handleRequestMethodChange = (value: OperLogRequestMethodValue) => {
    const next = { ...filterForm, requestMethod: value };
    setFilterForm(next);
    applyImmediately(next);
  };

  const handleStatusChange = (value: OperLogStatusValue) => {
    const next = { ...filterForm, status: value };
    setFilterForm(next);
    applyImmediately(next);
  };

  const handleRemoveFilter = (key: string) => {
    if (key === 'title') {
      const next: OperLogFilterState = { ...filterForm, title: '' };
      setFilterForm(next);
      applyImmediately(next);
      return;
    }
    if (key === 'operName') {
      const next: OperLogFilterState = { ...filterForm, operName: '' };
      setFilterForm(next);
      applyImmediately(next);
      return;
    }
    if (key === 'businessType') {
      const next: OperLogFilterState = {
        ...filterForm,
        businessType: 'all',
      };
      setFilterForm(next);
      applyImmediately(next);
      return;
    }
    if (key === 'requestMethod') {
      const next: OperLogFilterState = {
        ...filterForm,
        requestMethod: 'all',
      };
      setFilterForm(next);
      applyImmediately(next);
    }
  };

  const handleResetFilters = () => {
    clearDebounce();
    resetFilters();
  };

  const statusTabs = useMemo(
    () =>
      OPER_LOG_STATUS_TABS.map((tab) => ({
        value: tab.value,
        label: tab.label,
        activeColor: tab.color,
      })),
    [],
  );

  const businessTypeOptions = useMemo(
    () => [...OPER_LOG_BUSINESS_TYPE_OPTIONS],
    [],
  );
  const requestMethodOptions = useMemo(
    () => [...OPER_LOG_REQUEST_METHOD_OPTIONS],
    [],
  );

  const appliedFilterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (appliedFilters.title) {
      chips.push({
        key: 'title',
        label: '标题',
        value: appliedFilters.title,
      });
    }
    if (appliedFilters.operName) {
      chips.push({
        key: 'operName',
        label: '操作人',
        value: appliedFilters.operName,
      });
    }
    if (appliedFilters.businessType !== 'all') {
      const label =
        businessTypeOptions.find(
          (option) => option.value === appliedFilters.businessType,
        )?.label ?? appliedFilters.businessType;
      chips.push({
        key: 'businessType',
        label: '业务类型',
        value: label,
      });
    }
    if (appliedFilters.requestMethod !== 'all') {
      const label =
        requestMethodOptions.find(
          (option) => option.value === appliedFilters.requestMethod,
        )?.label ?? appliedFilters.requestMethod;
      chips.push({
        key: 'requestMethod',
        label: '请求方式',
        value: label,
      });
    }
    return chips;
  }, [
    appliedFilters.businessType,
    appliedFilters.operName,
    appliedFilters.requestMethod,
    appliedFilters.title,
    businessTypeOptions,
    requestMethodOptions,
  ]);

  return (
    <OperLogManagementFilters
      status={filterForm.status}
      statusTabs={statusTabs}
      onStatusChange={handleStatusChange}
      filters={{
        title: filterForm.title,
        operName: filterForm.operName,
        businessType: filterForm.businessType,
        requestMethod: filterForm.requestMethod,
      }}
      onTitleChange={handleTitleChange}
      onOperNameChange={handleOperNameChange}
      onBusinessTypeChange={handleBusinessTypeChange}
      onRequestMethodChange={handleRequestMethodChange}
      businessTypeOptions={businessTypeOptions}
      requestMethodOptions={requestMethodOptions}
      appliedFilters={appliedFilterChips}
      onRemoveFilter={handleRemoveFilter}
      onResetFilters={handleResetFilters}
    />
  );
}
