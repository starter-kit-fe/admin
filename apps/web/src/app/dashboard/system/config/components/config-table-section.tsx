'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { listConfigs } from '../api';
import { BASE_QUERY_KEY, CONFIG_TYPE_TABS } from '../constants';
import {
  useConfigManagementSetRefreshHandler,
  useConfigManagementSetRefreshing,
  useConfigManagementStore,
} from '@/app/dashboard/system/config/store';
import { resolveErrorMessage } from '../utils';
import type { SystemConfig } from '../type';

export function ConfigTableSection() {
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
  const queryClient = useQueryClient();

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
    keepPreviousData: true,
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
    setRefreshHandler(() => {
      void queryClient.invalidateQueries({ queryKey: BASE_QUERY_KEY });
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [queryClient, setRefreshHandler]);

  const renderTypeBadge = (type: string) => {
    const meta = CONFIG_TYPE_TABS.find((tab) => tab.value === type);
    if (!meta || meta.value === 'all') {
      return null;
    }
    return (
      <Badge
        variant="outline"
        className={
          type === 'Y'
            ? 'border-blue-500/40 bg-blue-500/10 text-blue-600'
            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
        }
      >
        {meta.label}
      </Badge>
    );
  };

  const handleEdit = (config: SystemConfig) => {
    openEdit(config);
  };

  const handleDelete = (config: SystemConfig) => {
    setDeleteTarget(config);
  };

  return (
    <Card className="border border-border/60 shadow-sm dark:border-border/40">
      <CardContent className="px-0 py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">参数名称</TableHead>
              <TableHead className="min-w-[160px]">参数键名</TableHead>
              <TableHead className="min-w-[220px]">参数键值</TableHead>
              <TableHead className="w-[120px]">类型</TableHead>
              <TableHead className="min-w-[200px]">备注</TableHead>
              <TableHead className="w-[120px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {configQuery.isLoading
                    ? '参数数据加载中...'
                    : '暂无参数记录。'}
                </TableCell>
              </TableRow>
            ) : (
              configs.map((config) => (
                <TableRow key={config.configId}>
                  <TableCell>{config.configName}</TableCell>
                  <TableCell>{config.configKey}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      {config.configValue}
                    </code>
                  </TableCell>
                  <TableCell>{renderTypeBadge(config.configType)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {config.remark ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => handleEdit(config)}
                      >
                        <Edit2 className="size-3.5" />
                        编辑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(config)}
                      >
                        <Trash2 className="size-3.5" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
