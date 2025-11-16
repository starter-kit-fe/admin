'use client';

import { useEffect, useMemo } from 'react';

import {
  DEFAULT_DEBOUNCE_MS,
  LOGIN_LOG_STATUS_VALUES,
} from '../../constants';
import {
  type LoginLogStatusValue,
  useLoginLogManagementStore,
} from '../../store';
import { LoginLogManagementFilters } from '../filters/login-log-management-filters';
import { useTranslations } from 'next-intl';

export function LoginLogFiltersSection() {
  const tFilters = useTranslations('LoginLogManagement.filters');
  const tStatus = useTranslations('LoginLogManagement.status');
  const {
    status,
    setStatus,
    filterForm,
    setFilterForm,
    applyFilters,
    resetFilters,
  } = useLoginLogManagementStore();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyFilters({
        userName: filterForm.userName.trim(),
        ipaddr: filterForm.ipaddr.trim(),
      });
    }, DEFAULT_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyFilters, filterForm.userName, filterForm.ipaddr]);

  const handleStatusChange = (value: string) => {
    setStatus(value as LoginLogStatusValue);
  };

  const handleUserNameChange = (value: string) => {
    setFilterForm((prev) => ({ ...prev, userName: value }));
  };

  const handleIpaddrChange = (value: string) => {
    setFilterForm((prev) => ({ ...prev, ipaddr: value }));
  };

  const statusTabs = useMemo(
    () =>
      LOGIN_LOG_STATUS_VALUES.map((value) => ({
        value,
        label:
          value === 'all'
            ? tFilters('statusTabs.all')
            : value === '0'
              ? tStatus('success')
              : tStatus('failed'),
      })),
    [tFilters, tStatus],
  );

  return (
    <section>
      <LoginLogManagementFilters
        status={status}
        onStatusChange={handleStatusChange}
        userName={filterForm.userName}
        onUserNameChange={handleUserNameChange}
        ipaddr={filterForm.ipaddr}
        onIpaddrChange={handleIpaddrChange}
        statusTabs={statusTabs}
        onReset={() => resetFilters()}
      />
    </section>
  );
}
