'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { listPosts } from './api';
import type { Post } from './type';

const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '在岗' },
  { value: '1', label: '停用' },
] as const;

export function PostManagement() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]['value']>('all');
  const [postName, setPostName] = useState('');
  const [postCode, setPostCode] = useState('');

  const query = useQuery({
    queryKey: ['system', 'posts', status, postName, postCode],
    queryFn: () =>
      listPosts({
        status: status === 'all' ? undefined : status,
        postName: postName || undefined,
        postCode: postCode || undefined,
      }),
  });

  const posts: Post[] = query.data ?? [];

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
              <CardTitle className="text-xl font-semibold">岗位管理</CardTitle>
              <CardDescription>查看系统岗位信息，支持按名称、编码与状态筛选。</CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Input
                className="sm:w-48"
                placeholder="岗位编码"
                value={postCode}
                onChange={(event) => setPostCode(event.target.value)}
              />
              <Input
                className="sm:w-48"
                placeholder="岗位名称"
                value={postName}
                onChange={(event) => setPostName(event.target.value)}
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
          <CardTitle className="text-lg font-semibold">岗位列表</CardTitle>
          <CardDescription>当前仅提供查询功能，后续可扩展新增与编辑。</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <InlineLoading label="加载中" />
            </div>
          ) : query.isError ? (
            <div className="py-10 text-center text-sm text-destructive">加载岗位数据失败，请稍后再试。</div>
          ) : posts.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">暂无数据</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">岗位编码</TableHead>
                    <TableHead className="min-w-[160px]">岗位名称</TableHead>
                    <TableHead className="w-[120px]">排序</TableHead>
                    <TableHead className="w-[120px]">状态</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.postId}>
                      <TableCell>{post.postCode}</TableCell>
                      <TableCell>{post.postName}</TableCell>
                      <TableCell>{post.postSort}</TableCell>
                      <TableCell>
                        <Badge variant={post.status === '0' ? 'secondary' : 'outline'}>
                          {post.status === '0' ? '在岗' : '停用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate text-muted-foreground">
                        {post.remark ?? '-'}
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
