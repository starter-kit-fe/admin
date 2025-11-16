'use client';

import {
  type ConfigTypeValue,
  useConfigAppliedFilters,
  useConfigFilterForm,
  useConfigType,
} from '@/app/dashboard/system/config/store';
import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { CONFIG_TYPE_TABS } from '../../constants';
import type {
  ConfigFilterChip,
  ConfigFilterKey,
} from '../filters/applied-filters';
import { ConfigManagementFilters } from '../filters/config-management-filters';

export function ConfigFiltersSection() {
  const { configType, setConfigType } = useConfigType();
  const { filterForm, setFilterForm } = useConfigFilterForm();
  const { appliedFilters, applyFilters } = useConfigAppliedFilters();
  const tFilters = useTranslations('ConfigManagement.filters');

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

  const filterChips = useMemo(() => {
    const chips: ConfigFilterChip[] = [];
    if (appliedFilters.configName) {
      chips.push({
        key: 'configName',
        label: tFilters('chips.configName'),
        value: appliedFilters.configName,
      });
    }
    if (appliedFilters.configKey) {
      chips.push({
        key: 'configKey',
        label: tFilters('chips.configKey'),
        value: appliedFilters.configKey,
      });
    }
    return chips;
  }, [appliedFilters.configKey, appliedFilters.configName, tFilters]);

  const typeTabs = useMemo(
    () =>
      CONFIG_TYPE_TABS.map((tab) => ({
        value: tab.value,
        label: tFilters(tab.labelKey),
      })),
    [tFilters],
  );

  const handleRemoveFilter = (key: ConfigFilterKey) => {
    const nextFilters = {
      configName: key === 'configName' ? '' : filterForm.configName,
      configKey: key === 'configKey' ? '' : filterForm.configKey,
    };
    setFilterForm(nextFilters);
    applyFilters(
      {
        configName: nextFilters.configName.trim(),
        configKey: nextFilters.configKey.trim(),
      },
      { force: true },
    );
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
      typeTabs={typeTabs}
      appliedFilters={filterChips}
      onRemoveFilter={handleRemoveFilter}
    />
  );
}
