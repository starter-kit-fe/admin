'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  useDepartmentEditorActions,
  useDepartmentDeleteState,
  useDepartmentFilters,
  useDepartmentManagementSetRefreshHandler,
  useDepartmentManagementSetRefreshing,
  useDepartmentTreeState,
} from '@/app/dashboard/system/dept/store';
import { InlineLoading } from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import { listDepartmentTree } from '../../api';
import { BASE_QUERY_KEY } from '../../constants';
import type { DepartmentNode } from '../../type';
import { DepartmentTreeView } from '../tree/department-tree-view';

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);
  return debounced;
}

export function DepartmentTreeSection() {
  const { status, keyword } = useDepartmentFilters();
  const { departmentTree, setDepartmentTree } = useDepartmentTreeState();
  const { openCreate, openEdit } = useDepartmentEditorActions();
  const { setDeleteTarget } = useDepartmentDeleteState();
  const setRefreshing = useDepartmentManagementSetRefreshing();
  const setRefreshHandler = useDepartmentManagementSetRefreshHandler();
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 400);

  const departmentQuery = useQuery({
    queryKey: [...BASE_QUERY_KEY, status, debouncedKeyword],
    queryFn: () =>
      listDepartmentTree({
        status: status === 'all' ? undefined : status,
        deptName: debouncedKeyword || undefined,
      }),
  });

  useEffect(() => {
    if (departmentQuery.data) {
      setDepartmentTree(departmentQuery.data);
    }
  }, [departmentQuery.data, setDepartmentTree]);

  useEffect(() => {
    setRefreshing(departmentQuery.isFetching);
  }, [departmentQuery.isFetching, setRefreshing]);

  useEffect(() => {
    const refetch = departmentQuery.refetch;
    setRefreshHandler(() => {
      void refetch();
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [departmentQuery.refetch, setRefreshHandler]);

  const handleAddChild = (node: DepartmentNode) => {
    openCreate(node.deptId);
  };

  const handleEdit = (node: DepartmentNode) => {
    openEdit(node);
  };

  const handleDelete = (node: DepartmentNode) => {
    setDeleteTarget(node);
  };

  return (
    <Card className="flex h-[calc(100vh-320px)] min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card py-0 shadow-none dark:border-border/40">
      {departmentQuery.isLoading && departmentTree.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <InlineLoading label="加载部门数据..." />
        </div>
      ) : departmentQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-destructive">
          加载部门数据失败，请稍后再试。
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => departmentQuery.refetch()}
          >
            重新加载
          </Button>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0 rounded-lg bg-muted/20 dark:bg-muted/10">
          <div className="p-3">
            <DepartmentTreeView
              nodes={departmentTree}
              onAddChild={handleAddChild}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
