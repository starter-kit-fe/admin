'use client';

import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { createMenu, updateMenu } from '../api';
import {
  MenuEditorDialog,
  type MenuParentOption,
} from './menu-editor-dialog';
import {
  useMenuManagementMutationCounter,
  useMenuManagementRefresh,
  useMenuManagementStore,
} from '../store';
import {
  buildParentOptions,
  collectDescendantIds,
  getNextOrderNum,
  toCreatePayload,
  toFormValues,
} from '../utils';
import type { CreateMenuPayload, MenuFormValues } from '../type';

export function MenuEditorManager() {
  const {
    editorState,
    closeEditor,
    menuTree,
  } = useMenuManagementStore();
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

  const editorDefaultValues: MenuFormValues | undefined = useMemo(() => {
    if (!editorState.open) {
      return undefined;
    }
    if (editorState.mode === 'edit') {
      return toFormValues(editorState.menu);
    }
    return {
      menuName: '',
      parentId: String(editorState.parentId ?? 0),
      orderNum: '',
      path: '',
      component: '',
      query: '',
      routeName: '',
      isFrame: false,
      isCache: false,
      menuType: 'C',
      visible: '0',
      status: '0',
      perms: '',
      icon: '#',
      remark: '',
    };
  }, [editorState]);

  const parentOptions = useMemo<MenuParentOption[]>(() => {
    if (!editorState.open) {
      return [
        {
          value: '0',
          label: '顶级菜单',
          level: 0,
          path: ['顶级菜单'],
          disabled: false,
        },
      ];
    }
    if (editorState.mode === 'edit') {
      const excludeIds = new Set<number>([
        editorState.menu.menuId,
        ...collectDescendantIds(editorState.menu),
      ]);
      return buildParentOptions(menuTree, excludeIds);
    }
    return buildParentOptions(menuTree, new Set<number>());
  }, [editorState, menuTree]);

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
