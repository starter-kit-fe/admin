'use client';

import {
  useConfigManagementSetRefreshHandler,
  useConfigManagementSetRefreshing,
  useConfigManagementStore,
} from '@/app/dashboard/system/config/store';
import { SelectionBanner } from '@/components/selection-banner';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { listConfigs } from '../../api';
import { BASE_QUERY_KEY } from '../../constants';
import type { SystemConfig } from '../../type';
import { ConfigTable } from '../list/config-table';

export function ConfigDataSection() {
  const {
    configType,
    appliedFilters,
    configs,
    setConfigs,
    openEdit,
    setDeleteTarget,
    selectedIds,
    setSelectedIds,
    clearSelectedIds,
    setBulkDeleteOpen,
  } = useConfigManagementStore();
  const setRefreshing = useConfigManagementSetRefreshing();
  const setRefreshHandler = useConfigManagementSetRefreshHandler();

  const configQuery = useQuery({
    queryKey: [
      ...BASE_QUERY_KEY,
      configType,
      appliedFilters.configName,
      appliedFilters.configKey,
    ],
    queryFn: () =>
      listConfigs({
        configType: configType === 'all' ? undefined : configType,
        configName: appliedFilters.configName || undefined,
        configKey: appliedFilters.configKey || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (configQuery.data) {
      setConfigs(configQuery.data);
    } else if (!configQuery.isLoading) {
      setConfigs([]);
    }
  }, [configQuery.data, configQuery.isLoading, setConfigs]);

  useEffect(() => {
    setRefreshing(configQuery.isFetching);
  }, [configQuery.isFetching, setRefreshing]);

  useEffect(() => {
    const refetch = configQuery.refetch;
    setRefreshHandler(() => {
      void refetch();
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [configQuery.refetch, setRefreshHandler]);

  const handleEdit = (config: SystemConfig) => {
    openEdit(config);
  };

  const handleDelete = (config: SystemConfig) => {
    setDeleteTarget(config);
  };

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<number>();
      configs.forEach((config) => {
        if (prev.has(config.configId)) {
          next.add(config.configId);
        }
      });
      return next;
    });
  }, [configs, setSelectedIds]);

  const selectedCount = selectedIds.size;
  const isAllSelected =
    configs.length > 0 &&
    configs.every((config) => selectedIds.has(config.configId));
  const headerCheckboxState = isAllSelected
    ? true
    : selectedCount > 0
      ? ('indeterminate' as const)
      : false;

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(configs.map((config) => config.configId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (configId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(configId);
      } else {
        next.delete(configId);
      }
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedCount === 0) {
      return;
    }
    setBulkDeleteOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <SelectionBanner
        count={selectedCount}
        onClear={clearSelectedIds}
        onBulkDelete={handleBulkDelete}
      />
      <ConfigTable
        rows={configs}
        isLoading={configQuery.isLoading}
        selectedIds={selectedIds}
        headerCheckboxState={headerCheckboxState}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelect={handleToggleSelect}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
