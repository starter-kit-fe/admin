'use client';

import {
  type TypeStatusValue,
  useDictManagementStore,
} from '@/app/dashboard/system/dict/store';
import { useEffect, useMemo } from 'react';

import { DEFAULT_DEBOUNCE_MS, TYPE_STATUS_TABS } from '../../constants';
import { DictTypeFilters } from '../filters/dict-type-filters';

export function DictTypeFiltersSection() {
  const {
    typeStatus,
    setTypeStatus,
    typeFilterForm,
    setTypeFilterForm,
    applyTypeFilters,
    resetTypeFilters,
  } = useDictManagementStore();

  const statusTabs = useMemo(() => TYPE_STATUS_TABS, []);

  const handleStatusChange = (value: string) => {
    setTypeStatus(value as TypeStatusValue);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyTypeFilters({
        dictName: typeFilterForm.dictName.trim(),
        dictType: typeFilterForm.dictType.trim(),
      });
    }, DEFAULT_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyTypeFilters, typeFilterForm.dictName, typeFilterForm.dictType]);

  return (
    <DictTypeFilters
      status={typeStatus}
      statusTabs={statusTabs}
      dictName={typeFilterForm.dictName}
      dictType={typeFilterForm.dictType}
      onStatusChange={handleStatusChange}
      onDictNameChange={(value) =>
        setTypeFilterForm((prev) => ({ ...prev, dictName: value }))
      }
      onDictTypeChange={(value) =>
        setTypeFilterForm((prev) => ({ ...prev, dictType: value }))
      }
      onReset={() => resetTypeFilters()}
    />
  );
}
