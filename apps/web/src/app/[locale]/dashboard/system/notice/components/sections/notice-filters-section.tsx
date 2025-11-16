'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';

import {
  type NoticeStatusValue,
  type NoticeTypeValue,
  useNoticeManagementStore,
} from '@/app/dashboard/system/notice/store';

import {
  DEFAULT_DEBOUNCE_MS,
  NOTICE_STATUS_TABS,
  NOTICE_TYPE_OPTIONS,
} from '../../constants';
import {
  NoticeManagementFilters,
  type FilterChip,
} from '../filters/notice-management-filters';

export function NoticeFiltersSection() {
  const {
    status,
    setStatus,
    noticeType,
    setNoticeType,
    filterForm,
    setFilterForm,
    appliedFilters,
    applyFilters,
    resetFilters,
  } = useNoticeManagementStore();
  const tFilters = useTranslations('NoticeManagement.filters');

  const keywordDebounceRef = useRef<number | null>(null);

  const clearKeywordDebounce = useCallback(() => {
    if (keywordDebounceRef.current) {
      window.clearTimeout(keywordDebounceRef.current);
      keywordDebounceRef.current = null;
    }
  }, []);

  const scheduleKeywordFilter = useCallback(
    (value: string) => {
      clearKeywordDebounce();
      keywordDebounceRef.current = window.setTimeout(() => {
        applyFilters({ noticeTitle: value.trim() });
      }, DEFAULT_DEBOUNCE_MS);
    },
    [applyFilters, clearKeywordDebounce],
  );

  useEffect(() => {
    return () => {
      clearKeywordDebounce();
    };
  }, [clearKeywordDebounce]);

  const handleStatusChange = (value: string) => {
    setStatus(value as NoticeStatusValue);
  };

  const handleNoticeTypeChange = (value: string) => {
    setNoticeType(value as NoticeTypeValue);
  };

  const handleKeywordChange = (value: string) => {
    setFilterForm({ noticeTitle: value });
    scheduleKeywordFilter(value);
  };

  const handleRemoveFilter = (key: string) => {
    if (key === 'noticeType') {
      setNoticeType('all');
      return;
    }

    if (key === 'noticeTitle') {
      clearKeywordDebounce();
      setFilterForm({ noticeTitle: '' });
      applyFilters({ noticeTitle: '' });
    }
  };

  const handleResetFilters = () => {
    clearKeywordDebounce();
    setNoticeType('all');
    resetFilters();
  };

  const statusTabs = useMemo(
    () =>
      NOTICE_STATUS_TABS.map((tab) => ({
        value: tab.value,
        label: tFilters(tab.labelKey),
        activeColor: tab.color,
      })),
    [tFilters],
  );

  const noticeTypeOptions = useMemo(
    () =>
      NOTICE_TYPE_OPTIONS.map((option) => ({
        value: option.value,
        label: tFilters(option.labelKey),
      })),
    [tFilters],
  );

  const appliedFilterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (noticeType !== 'all') {
      const label =
        noticeTypeOptions.find((option) => option.value === noticeType)
          ?.label ?? noticeType;
      chips.push({
        key: 'noticeType',
        label: tFilters('chips.noticeType'),
        value: label,
      });
    }
    if (appliedFilters.noticeTitle) {
      chips.push({
        key: 'noticeTitle',
        label: tFilters('chips.noticeTitle'),
        value: appliedFilters.noticeTitle,
      });
    }
    return chips;
  }, [
    appliedFilters.noticeTitle,
    noticeType,
    noticeTypeOptions,
    tFilters,
  ]);

  return (
    <NoticeManagementFilters
      statusTabs={statusTabs}
      status={status}
      noticeType={noticeType}
      noticeTypeOptions={noticeTypeOptions}
      keyword={filterForm.noticeTitle}
      appliedFilters={appliedFilterChips}
      onStatusChange={handleStatusChange}
      onNoticeTypeChange={handleNoticeTypeChange}
      onKeywordChange={handleKeywordChange}
      onRemoveFilter={handleRemoveFilter}
      onResetFilters={handleResetFilters}
    />
  );
}
