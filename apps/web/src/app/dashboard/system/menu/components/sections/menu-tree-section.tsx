'use client';

import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { listMenuTree, reorderMenus } from '@/app/dashboard/system/menu/api';
import {
  useMenuManagementMutationCounter,
  useMenuManagementSetRefreshHandler,
  useMenuManagementSetRefreshing,
  useMenuManagementStore,
} from '@/app/dashboard/system/menu/store';
import type { MenuOrderUpdate } from '@/app/dashboard/system/menu/type';
import { reorderTree } from '@/app/dashboard/system/menu/utils';
import { MenuTreeView } from '../tree/menu-tree-view';

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

export function MenuTreeSection() {
  const {
    status,
    keyword,
    menuTree,
    setMenuTree,
    openCreate,
    openEdit,
    setDeleteTarget,
  } = useMenuManagementStore();
  const setRefreshing = useMenuManagementSetRefreshing();
  const setRefreshHandler = useMenuManagementSetRefreshHandler();
  const { beginMutation, endMutation } = useMenuManagementMutationCounter();

  const debouncedKeyword = useDebouncedValue(keyword.trim(), 400);

  const queryKey = useMemo(
    () => ['system', 'menus', 'tree', status, debouncedKeyword],
    [status, debouncedKeyword],
  );

  const menuQuery = useQuery({
    queryKey,
    queryFn: () =>
      listMenuTree({
        status: status === 'all' ? undefined : status,
        menuName: debouncedKeyword || undefined,
      }),
  });

  useEffect(() => {
    if (menuQuery.data) {
      setMenuTree(menuQuery.data);
    }
  }, [menuQuery.data, setMenuTree]);

  useEffect(() => {
    setRefreshing(menuQuery.isFetching);
  }, [menuQuery.isFetching, setRefreshing]);

  useEffect(() => {
    const handler = () => {
      void menuQuery.refetch();
    };
    setRefreshHandler(handler);
    return () => {
      setRefreshHandler(() => {});
    };
  }, [menuQuery.refetch, setRefreshHandler]);

  const reorderMutation = useMutation({
    mutationFn: (payload: MenuOrderUpdate[]) => reorderMenus(payload),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('菜单排序已更新');
      void menuQuery.refetch();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '更新排序失败，请稍后再试';
      toast.error(message);
      void menuQuery.refetch();
    },
    onSettled: () => {
      endMutation();
    },
  });

  const handleReorder = useCallback(
    (parentId: number, orderedIds: number[]) => {
      setMenuTree((prev) => reorderTree(prev, parentId, orderedIds));
      const payload: MenuOrderUpdate[] = orderedIds.map((id, index) => ({
        menuId: id,
        parentId,
        orderNum: index + 1,
      }));
      reorderMutation.mutate(payload);
    },
    [reorderMutation, setMenuTree],
  );

  if (menuQuery.isError) {
    return (
      <section className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-3  dark:border-border/40">
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-destructive">
          加载菜单失败，请稍后重试。
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => menuQuery.refetch()}
          >
            重新加载
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-3  dark:border-border/40">
      <div className="flex-1 overflow-y-auto rounded-lg bg-muted/20 p-3 dark:bg-muted/10">
        <MenuTreeView
          nodes={menuTree}
          loading={menuQuery.isLoading}
          onAddChild={(parent) => openCreate(parent.menuId)}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onReorder={handleReorder}
        />
      </div>
    </section>
  );
}
