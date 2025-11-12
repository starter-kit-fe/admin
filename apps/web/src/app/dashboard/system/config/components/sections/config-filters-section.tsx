'use client';

import {
  type ConfigTypeValue,
  useConfigManagementStore,
} from '@/app/dashboard/system/config/store';
import { useEffect } from 'react';

import { CONFIG_TYPE_TABS } from '../../constants';
import { ConfigManagementFilters } from '../filters/config-management-filters';

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
      applyFilters(
        {
          configName: filterForm.configName.trim(),
          configKey: filterForm.configKey.trim(),
        },
        { force: true },
      );
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [applyFilters, filterForm.configKey, filterForm.configName]);

  const handleConfigTypeChange = (value: string) => {
    setConfigType(value as ConfigTypeValue);
  };

  const handleReset = () => {
    resetFilters();
    applyFilters({ configName: '', configKey: '' }, { force: true });
  };

  return (
    <ConfigManagementFilters
      configType={configType}
      onConfigTypeChange={handleConfigTypeChange}
      configName={filterForm.configName}
      onConfigNameChange={(value) =>
        setFilterForm((prev) => ({ ...prev, configName: value }))
      }
      configKey={filterForm.configKey}
      onConfigKeyChange={(value) =>
        setFilterForm((prev) => ({ ...prev, configKey: value }))
      }
      typeTabs={CONFIG_TYPE_TABS}
      onReset={handleReset}
    />
  );
}
