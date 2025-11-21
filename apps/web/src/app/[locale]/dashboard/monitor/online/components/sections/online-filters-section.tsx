'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
} from 'react';
import { useTranslations } from 'next-intl';

import type { OnlineFilterChip } from '../filters/online-applied-filters';
import { OnlineManagementFilters } from '../filters/online-management-filters';
import { useOnlineUserManagementStore } from '../../store';

export function OnlineUserFiltersSection() {
  const t = useTranslations('OnlineUserManagement');
  const {
    filterForm,
    appliedFilters,
    setFilterForm,
    applyFilters,
    resetFilters,
  } = useOnlineUserManagementStore();

  const userNameTimer = useRef<number | null>(null);
  const ipTimer = useRef<number | null>(null);

  const clearTimer = useCallback((ref: MutableRefObject<number | null>) => {
    if (ref.current) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer(userNameTimer);
      clearTimer(ipTimer);
    };
  }, [clearTimer]);

  const scheduleApply = useCallback(
    (ref: MutableRefObject<number | null>, nextFilters: typeof filterForm) => {
      clearTimer(ref);
      ref.current = window.setTimeout(() => {
        applyFilters(nextFilters);
      }, 300);
    },
    [applyFilters, clearTimer],
  );

  const handleUserNameChange = (value: string) => {
    const next = { ...filterForm, userName: value };
    setFilterForm(next);
    scheduleApply(userNameTimer, next);
  };

  const handleIpChange = (value: string) => {
    const next = { ...filterForm, ipaddr: value };
    setFilterForm(next);
    scheduleApply(ipTimer, next);
  };

  const filterChips = (
    [
      {
        key: 'userName' as const,
        label: t('filters.chips.account'),
        value: appliedFilters.userName.trim(),
      },
      {
        key: 'ipaddr' as const,
        label: t('filters.chips.ip'),
        value: appliedFilters.ipaddr.trim(),
      },
    ] satisfies OnlineFilterChip[]
  ).filter((chip) => Boolean(chip.value));

  const handleRemoveFilter = (key: 'userName' | 'ipaddr') => {
    clearTimer(userNameTimer);
    clearTimer(ipTimer);
    const next =
      key === 'userName'
        ? { ...appliedFilters, userName: '' }
        : { ...appliedFilters, ipaddr: '' };
    setFilterForm(next);
    applyFilters(next, { force: true });
  };

  const handleClearFilters = () => {
    clearTimer(userNameTimer);
    clearTimer(ipTimer);
    resetFilters();
  };

  return (
    <section className="rounded-xl border border-border/50 bg-card p-4">
      <OnlineManagementFilters
        userName={filterForm.userName}
        ipaddr={filterForm.ipaddr}
        filterChips={filterChips}
        onUserNameChange={handleUserNameChange}
        onIpChange={handleIpChange}
        onRemoveFilter={handleRemoveFilter}
        onClearFilters={handleClearFilters}
      />
    </section>
  );
}
