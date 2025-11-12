'use client';

import {
  useConfigManagementSetRefreshHandler,
  useConfigManagementSetRefreshing,
  useConfigManagementStore,
} from '@/app/dashboard/system/config/store';
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

  return (
    <ConfigTable
      rows={configs}
      isLoading={configQuery.isLoading}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
