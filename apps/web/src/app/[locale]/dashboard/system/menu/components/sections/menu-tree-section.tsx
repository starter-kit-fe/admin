'use client';

import { listMenuTree, reorderMenus } from '@/app/dashboard/system/menu/api';
import {
  useMenuManagementMutationCounter,
  useMenuManagementSetRefreshHandler,
  useMenuManagementSetRefreshing,
  useMenuManagementStore,
} from '@/app/dashboard/system/menu/store';
import type { MenuOrderUpdate } from '@/app/dashboard/system/menu/type';
import { reorderTree } from '@/app/dashboard/system/menu/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('MenuManagement');
  const {
    status,
    keyword,
    menuTree,
    setMenuTree,
    openCreate,
    openEdit,
    setDeleteTarget,
  } = useMenuManagementStore();
  const { hasPermission } = usePermissions();
  const canAddMenu = hasPermission('system:menu:add');
  const canEditMenu = hasPermission('system:menu:edit');
  const canDeleteMenu = hasPermission('system:menu:remove');
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
      toast.success(t('toast.reorderSuccess'));
      void menuQuery.refetch();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t('toast.reorderError');
      toast.error(message);
      void menuQuery.refetch();
    },
    onSettled: () => {
      endMutation();
    },
  });

  const handleReorder = useCallback(
    (parentId: number, orderedIds: number[]) => {
      if (!canEditMenu) {
        return;
      }
      setMenuTree((prev) => reorderTree(prev, parentId, orderedIds));
      const payload: MenuOrderUpdate[] = orderedIds.map((id, index) => ({
        id: id,
        parentId,
        orderNum: index + 1,
      }));
      reorderMutation.mutate(payload);
    },
    [canEditMenu, reorderMutation, setMenuTree],
  );

  if (menuQuery.isError) {
    return (
      <Card className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-3  dark:border-border/40">
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-destructive">
          {t('tree.error')}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => menuQuery.refetch()}
          >
            {t('tree.retry')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-none p-4 border-none ">
      <MenuTreeView
        nodes={menuTree}
        loading={menuQuery.isLoading}
        onAddChild={(parent) => openCreate(parent.id)}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onReorder={handleReorder}
        canAddChild={canAddMenu}
        canEdit={canEditMenu}
        canDelete={canDeleteMenu}
        canReorder={canEditMenu}
      />
    </Card>
  );
}
