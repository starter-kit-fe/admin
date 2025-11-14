'use client';

import {
  type TypeStatusValue,
  useDictTypeAppliedFilters,
  useDictTypeFilterForm,
  useDictTypeStatus,
} from '@/app/dashboard/system/dict/store';
import { useCallback, useEffect, useMemo } from 'react';

import { DEFAULT_DEBOUNCE_MS, TYPE_STATUS_TABS } from '../../constants';
import { DictTypeAppliedFilters } from '../filters/dict-type-applied-filters';
import { DictTypeFilters } from '../filters/dict-type-filters';

export function DictTypeFiltersSection() {
  const { typeStatus, setTypeStatus } = useDictTypeStatus();
  const { typeFilterForm, setTypeFilterForm } = useDictTypeFilterForm();
  const { typeAppliedFilters, applyTypeFilters, resetTypeFilters } =
    useDictTypeAppliedFilters();

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

  const handleRemoveAppliedFilter = useCallback(
    (key: 'dictName' | 'dictType') => {
      setTypeFilterForm((prev) => ({ ...prev, [key]: '' }));
      const nextFilters = {
        dictName: key === 'dictName' ? '' : typeAppliedFilters.dictName,
        dictType: key === 'dictType' ? '' : typeAppliedFilters.dictType,
      };
      applyTypeFilters(nextFilters, { force: true });
    },
    [applyTypeFilters, setTypeFilterForm, typeAppliedFilters.dictName, typeAppliedFilters.dictType],
  );

  const handleClearFilters = useCallback(() => {
    resetTypeFilters();
  }, [resetTypeFilters]);

  return (
    <div className="space-y-3">
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
      />
      <DictTypeAppliedFilters
        dictName={typeAppliedFilters.dictName}
        dictType={typeAppliedFilters.dictType}
        onRemove={handleRemoveAppliedFilter}
        onClear={handleClearFilters}
      />
    </div>
  );
}
