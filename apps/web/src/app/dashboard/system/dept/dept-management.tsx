'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { InlineLoading } from '@/components/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { listDepartmentTree } from './api';
import type { DepartmentNode } from './type';
import { DepartmentTree } from './department-tree';

const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '正常' },
  { value: '1', label: '停用' },
] as const;

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delay);
    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}

export function DeptManagement() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]['value']>('all');
  const [keyword, setKeyword] = useState('');

  const debouncedKeyword = useDebouncedValue(keyword.trim(), 400);

  const query = useQuery({
    queryKey: ['system', 'departments', 'tree', status, debouncedKeyword],
    queryFn: () =>
      listDepartmentTree({
        status: status === 'all' ? undefined : status,
        deptName: debouncedKeyword || undefined,
      }),
  });

  const nodes: DepartmentNode[] = query.data ?? [];

  const statusTabs = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        value: tab.value,
        label: tab.label,
      })),
    [],
  );

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value as (typeof STATUS_TABS)[number]['value']);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pb-10">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">部门管理</CardTitle>
            <CardDescription>浏览组织结构，支持按名称和状态筛选。</CardDescription>
          </div>
          <Input
            className="sm:w-64"
            placeholder="搜索部门名称"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </CardHeader>
        <CardContent>
          <Tabs value={status} onValueChange={handleStatusChange}>
            <TabsList>
              {statusTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">部门树</CardTitle>
          <CardDescription>可展开层级查看部门详情。</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <InlineLoading label="加载中" />
            </div>
          ) : query.isError ? (
            <div className="py-10 text-center text-sm text-destructive">加载部门数据失败，请稍后再试。</div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto rounded-lg border border-border/60 bg-muted/10 p-3">
              <DepartmentTree nodes={nodes} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
