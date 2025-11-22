'use client';

import { useEffect } from 'react';

import {
  DEFAULT_DEBOUNCE_MS,
  LOGIN_LOG_STATUS_TABS,
} from '../../constants';
import {
  type LoginLogStatusValue,
  useLoginLogManagementStore,
} from '../../store';
import { LoginLogManagementFilters } from '../filters/login-log-management-filters';
import { useTranslations } from 'next-intl';

export function LoginLogFiltersSection() {
  const {
    status,
    setStatus,
    filterForm,
    setFilterForm,
    applyFilters,
    resetFilters,
  } = useLoginLogManagementStore();
  const t = useTranslations('LoginLogManagement');

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

  return (
    <section>
      <LoginLogManagementFilters
        status={status}
        onStatusChange={handleStatusChange}
        userName={filterForm.userName}
        onUserNameChange={handleUserNameChange}
        ipaddr={filterForm.ipaddr}
        onIpaddrChange={handleIpaddrChange}
        statusTabs={LOGIN_LOG_STATUS_TABS.map((value) => ({
          value,
          label:
            value === 'all'
              ? t('filters.statusTabs.all')
              : value === '0'
                ? t('status.success')
                : t('status.failed'),
        }))}
        onReset={() => resetFilters()}
      />
    </section>
  );
}
