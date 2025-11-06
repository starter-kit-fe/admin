'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusTabs } from '@/components/status-tabs';

import { CONFIG_TYPE_TABS } from '../constants';
import {
  useConfigManagementStore,
  type ConfigTypeValue,
} from '@/app/dashboard/system/config/store';

export function ConfigFiltersSection() {
  const {
    configType,
    setConfigType,
    filterForm,
    setFilterForm,
    applyFilters,
    resetFilters,
  } = useConfigManagementStore();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyFilters({
        configName: filterForm.configName.trim(),
        configKey: filterForm.configKey.trim(),
      });
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyFilters, filterForm.configKey, filterForm.configName]);

  return (
    <section className="rounded-xl border border-border/60 bg-background/90 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4">
        <StatusTabs
          value={configType}
          onValueChange={(value) => setConfigType(value as ConfigTypeValue)}
          tabs={CONFIG_TYPE_TABS}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="按名称搜索"
            value={filterForm.configName}
            onChange={(event) =>
              setFilterForm((prev) => ({
                ...prev,
                configName: event.target.value,
              }))
            }
          />
          <Input
            placeholder="按配置键搜索"
            value={filterForm.configKey}
            onChange={(event) =>
              setFilterForm((prev) => ({
                ...prev,
                configKey: event.target.value,
              }))
            }
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetFilters()}
          >
            重置
          </Button>
        </div>
      </div>
    </section>
  );
}
