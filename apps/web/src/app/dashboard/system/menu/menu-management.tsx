'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { InlineLoading } from '@/components/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { listMenuTree } from './api';
import type { MenuTreeNode } from './type';
import { MenuPermissionTree } from '../role/components/menu-permission-tree';

const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '显示' },
  { value: '1', label: '隐藏' },
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

export function MenuManagement() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]['value']>('all');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  const debouncedKeyword = useDebouncedValue(keyword.trim(), 400);

  const query = useQuery({
    queryKey: ['system', 'menus', 'tree', status, debouncedKeyword],
    queryFn: () =>
      listMenuTree({
        status: status === 'all' ? undefined : status,
        menuName: debouncedKeyword || undefined,
      }),
  });

  const nodes: MenuTreeNode[] = query.data ?? [];

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value as (typeof STATUS_TABS)[number]['value']);
  }, []);

  const statusTabs = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        value: tab.value,
        label: tab.label,
      })),
    [],
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pb-10">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">菜单管理</CardTitle>
            <CardDescription>查看系统菜单结构，支持快速检索和展开。</CardDescription>
          </div>
          <Input
            className="sm:w-64"
            placeholder="搜索菜单名称"
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
          <CardTitle className="text-lg font-semibold">菜单树</CardTitle>
          <CardDescription>支持展开折叠与父子联动，方便分配菜单权限。</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <InlineLoading label="加载中" />
            </div>
          ) : query.isError ? (
            <div className="py-10 text-center text-sm text-destructive">加载菜单失败，请稍后再试。</div>
          ) : (
            <MenuPermissionTree
              nodes={nodes}
              value={selected}
              onChange={setSelected}
              disabled={query.isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
