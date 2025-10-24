'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { listDictTypes } from './api';
import type { DictType } from './type';

const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '正常' },
  { value: '1', label: '停用' },
] as const;

export function DictManagement() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]['value']>('all');
  const [dictName, setDictName] = useState('');
  const [dictType, setDictType] = useState('');

  const query = useQuery({
    queryKey: ['system', 'dicts', status, dictName, dictType],
    queryFn: () =>
      listDictTypes({
        status: status === 'all' ? undefined : status,
        dictName: dictName || undefined,
        dictType: dictType || undefined,
      }),
  });

  const items: DictType[] = query.data ?? [];

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
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">字典管理</CardTitle>
              <CardDescription>管理系统字典类型，支持按字典名称、类型和状态筛选。</CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Input
                className="sm:w-48"
                placeholder="字典类型"
                value={dictType}
                onChange={(event) => setDictType(event.target.value)}
              />
              <Input
                className="sm:w-48"
                placeholder="字典名称"
                value={dictName}
                onChange={(event) => setDictName(event.target.value)}
              />
            </div>
          </div>
          <Tabs value={status} onValueChange={(value) => setStatus(value as (typeof STATUS_TABS)[number]['value'])}>
            <TabsList>
              {statusTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">字典列表</CardTitle>
          <CardDescription>当前仅支持查看字典类型信息。</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <InlineLoading label="加载中" />
            </div>
          ) : query.isError ? (
            <div className="py-10 text-center text-sm text-destructive">加载字典数据失败，请稍后再试。</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">暂无数据</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">字典名称</TableHead>
                    <TableHead className="min-w-[160px]">字典类型</TableHead>
                    <TableHead className="w-[120px]">状态</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.dictId}>
                      <TableCell>{item.dictName}</TableCell>
                      <TableCell>{item.dictType}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === '0' ? 'secondary' : 'outline'}>
                          {item.status === '0' ? '正常' : '停用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate text-muted-foreground">
                        {item.remark ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
