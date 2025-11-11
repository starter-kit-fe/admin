'use client';

import {
  type TypeStatusValue,
  useDictManagementStore,
} from '@/app/dashboard/system/dict/store';
import { StatusTabs } from '@/components/status-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useMemo } from 'react';

import { DEFAULT_DEBOUNCE_MS, TYPE_STATUS_TABS } from '../constants';

export function DictFiltersSection() {
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
    <section className="rounded-xl border border-border/60 bg-background/90 p-4  sm:p-5">
      <div className="flex flex-col gap-4">
        <StatusTabs
          value={typeStatus}
          onValueChange={handleStatusChange}
          tabs={statusTabs}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              字典名称
            </label>
            <Input
              placeholder="输入字典名称"
              value={typeFilterForm.dictName}
              onChange={(event) =>
                setTypeFilterForm((prev) => ({
                  ...prev,
                  dictName: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              字典类型
            </label>
            <Input
              placeholder="输入字典类型"
              value={typeFilterForm.dictType}
              onChange={(event) =>
                setTypeFilterForm((prev) => ({
                  ...prev,
                  dictType: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetTypeFilters()}
          >
            重置
          </Button>
        </div>
      </div>
    </section>
  );
}
