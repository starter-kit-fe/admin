'use client';

import { createMenu, updateMenu } from '@/app/dashboard/system/menu/api';
import {
  useMenuManagementMutationCounter,
  useMenuManagementRefresh,
  useMenuManagementStore,
} from '@/app/dashboard/system/menu/store';
import type {
  CreateMenuPayload,
  MenuFormValues,
} from '@/app/dashboard/system/menu/type';
import {
  buildParentOptions,
  collectDescendantIds,
  filterParentOptions,
  findMenuNodeById,
  getNextOrderNum,
  toCreatePayload,
  toFormValues,
} from '@/app/dashboard/system/menu/utils';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { MenuEditorDialog, type MenuParentOption } from './menu-editor-dialog';

export function MenuEditorManager() {
  const { editorState, closeEditor, menuTree } = useMenuManagementStore();
  const refresh = useMenuManagementRefresh();
  const { beginMutation, endMutation } = useMenuManagementMutationCounter();

  const createMutation = useMutation({
    mutationFn: createMenu,
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('菜单创建成功');
      closeEditor();
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '创建菜单失败，请稍后再试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      menuId,
      payload,
    }: {
      menuId: number;
      payload: CreateMenuPayload;
    }) => updateMenu(menuId, payload),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('菜单已更新');
      closeEditor();
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '更新菜单失败，请稍后再试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  const resolvedParentId = useMemo(() => {
    if (!editorState.open) {
      return 0;
    }
    if (editorState.mode === 'create') {
      const requested = editorState.parentId ?? 0;
      if (requested === 0) {
        return 0;
      }
      const parentNode = findMenuNodeById(menuTree, requested);
      if (!parentNode) {
        return requested;
      }
      if (parentNode.menuType === 'M') {
        return parentNode.menuId;
      }
      return parentNode.parentId ?? 0;
    }
    return editorState.mode === 'edit' ? editorState.menu.parentId : 0;
  }, [editorState, menuTree]);

  const editorDefaultValues: MenuFormValues | undefined = useMemo(() => {
    if (!editorState.open) {
      return undefined;
    }
    if (editorState.mode === 'edit') {
      return toFormValues(editorState.menu);
    }
    const defaultMenuType: MenuFormValues['menuType'] =
      resolvedParentId === 0 ? 'M' : 'C';
    return {
      menuName: '',
      parentId: String(resolvedParentId ?? 0),
      orderNum: '',
      path: '',
      query: '',
      isFrame: false,
      isCache: false,
      menuType: defaultMenuType,
      visible: '0',
      status: '0',
      perms: '',
      icon: '',
      remark: '',
    };
  }, [editorState, resolvedParentId]);

  const baseParentOptions = useMemo<MenuParentOption[]>(
    () => buildParentOptions(menuTree),
    [menuTree],
  );

  const parentOptions = useMemo<MenuParentOption[]>(() => {
    if (!editorState.open) {
      return baseParentOptions;
    }
    if (editorState.mode === 'edit') {
      const excludeIds = new Set<number>([
        editorState.menu.menuId,
        ...collectDescendantIds(editorState.menu),
      ]);
      return filterParentOptions(baseParentOptions, excludeIds);
    }
    return baseParentOptions;
  }, [baseParentOptions, editorState]);

  const handleSubmit = (values: MenuFormValues) => {
    const payload = toCreatePayload(values);
    if (editorState.open) {
      if (editorState.mode === 'edit') {
        updateMutation.mutate({
          menuId: editorState.menu.menuId,
          payload,
        });
        return;
      }
      if (editorState.mode === 'create') {
        if (values.orderNum.trim() === '') {
          const parentIdForOrder = Number(values.parentId) || 0;
          payload.orderNum = getNextOrderNum(menuTree, parentIdForOrder);
        }
        createMutation.mutate(payload);
        return;
      }
    }
    createMutation.mutate(payload);
  };

  return (
    <MenuEditorDialog
      mode={
        editorState.open
          ? editorState.mode === 'edit'
            ? 'edit'
            : 'create'
          : 'create'
      }
      open={editorState.open}
      defaultValues={editorDefaultValues}
      parentOptions={parentOptions}
      submitting={createMutation.isPending || updateMutation.isPending}
      onOpenChange={(open) => {
        if (!open) {
          closeEditor();
        }
      }}
      onSubmit={handleSubmit}
    />
  );
}
