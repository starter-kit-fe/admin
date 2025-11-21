'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { STATUS_TABS } from '../../constants';
import {
  usePostManagementStore,
  type StatusValue,
} from '@/app/dashboard/system/post/store';
import { AppliedFilters } from '../filters/applied-filters';
import { PostManagementFilters } from '../filters/post-management-filters';

export function PostFiltersSection() {
  const t = useTranslations('PostManagement');
  const {
    status,
    setStatus,
    filterForm,
    setFilterForm,
    appliedFilters,
    applyFilters,
    resetFilters,
    statusCounts,
  } = usePostManagementStore();

  const statusTabs = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        value: tab.value,
        label: t(tab.labelKey),
        activeColor: tab.activeColor,
      })),
    [t],
  );

  const handleStatusChange = (value: string) => {
    setStatus(value as StatusValue);
  };

  const handlePostNameChange = (value: string) => {
    setFilterForm({ postName: value });
  };

  const handleRemoveFilter = (key: string) => {
    if (key === 'postName') {
      setFilterForm({ postName: '' });
      applyFilters({ postName: '' }, { force: true });
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyFilters({ postName: filterForm.postName.trim() });
    }, 350);
    return () => {
      window.clearTimeout(timer);
    };
  }, [applyFilters, filterForm.postName]);

  const filterChips = useMemo(() => {
    const chips = [];
    if (appliedFilters.postName) {
      chips.push({
        key: 'postName',
        label: t('filters.chips.postName'),
        value: appliedFilters.postName,
      });
    }
    return chips;
  }, [appliedFilters.postName, t]);

  return (
    <div className="flex flex-col gap-4">
      <PostManagementFilters
        status={status}
        tabs={statusTabs}
        onStatusChange={handleStatusChange}
        postName={filterForm.postName}
        onPostNameChange={handlePostNameChange}
      />
      <AppliedFilters items={filterChips} onRemove={handleRemoveFilter} />
      {filterForm.postName || filterChips.length > 0 ? (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetFilters()}
          >
            {t('filters.reset')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
