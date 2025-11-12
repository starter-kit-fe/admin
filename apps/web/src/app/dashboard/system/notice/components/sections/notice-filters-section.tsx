'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  type NoticeStatusValue,
  type NoticeTypeValue,
  useNoticeManagementStore,
} from '@/app/dashboard/system/notice/store';

import {
  DEFAULT_DEBOUNCE_MS,
  NOTICE_STATUS_TABS,
  NOTICE_TYPE_TABS,
} from '../../constants';
import { NoticeManagementFilters } from '../filters/notice-management-filters';

export function NoticeFiltersSection() {
  const {
    status,
    setStatus,
    noticeType,
    setNoticeType,
    filterForm,
    setFilterForm,
    applyFilters,
    resetFilters,
  } = useNoticeManagementStore();

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

  const handleReset = () => {
    clearKeywordDebounce();
    resetFilters();
  };

  const statusTabs = useMemo(() => [...NOTICE_STATUS_TABS], []);
  const noticeTypeTabs = useMemo(() => [...NOTICE_TYPE_TABS], []);

  return (
    <NoticeManagementFilters
      statusTabs={statusTabs}
      noticeTypeTabs={noticeTypeTabs}
      status={status}
      noticeType={noticeType}
      keyword={filterForm.noticeTitle}
      onStatusChange={handleStatusChange}
      onNoticeTypeChange={handleNoticeTypeChange}
      onKeywordChange={handleKeywordChange}
      onReset={handleReset}
    />
  );
}
