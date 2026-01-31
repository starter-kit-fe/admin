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
  MenuType,
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

interface CreateParentContext {
  parentId: number;
  parentType?: MenuType;
}

const ROOT_PARENT_CONTEXT: CreateParentContext = {
  parentId: 0,
  parentType: 'M',
};

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
    mutationFn: ({ id, payload }: { id: number; payload: CreateMenuPayload }) =>
      updateMenu(id, payload),
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

  const createParentContext = useMemo<CreateParentContext>(() => {
    if (!editorState.open || editorState.mode !== 'create') {
      return ROOT_PARENT_CONTEXT;
    }

    const requestedParentId = editorState.parentId ?? 0;
    if (requestedParentId === 0) {
      return ROOT_PARENT_CONTEXT;
    }

    const requestedNode = findMenuNodeById(menuTree, requestedParentId);
    if (!requestedNode) {
      return {
        parentId: requestedParentId,
        parentType: undefined,
      };
    }

    if (requestedNode.menuType === 'F') {
      const fallbackId = requestedNode.parentId ?? 0;
      if (fallbackId === 0) {
        return ROOT_PARENT_CONTEXT;
      }
      const fallbackNode = findMenuNodeById(menuTree, fallbackId);
      return {
        parentId: fallbackNode ? fallbackNode.id : fallbackId,
        parentType: fallbackNode?.menuType,
      };
    }

    return {
      parentId: requestedNode.id,
      parentType: requestedNode.menuType,
    };
  }, [editorState, menuTree]);

  const { parentId: createParentId, parentType: createParentType } =
    createParentContext;

  const editorDefaultValues: MenuFormValues | undefined = useMemo(() => {
    if (!editorState.open) {
      return undefined;
    }
    if (editorState.mode === 'edit') {
      return toFormValues(editorState.menu);
    }
    const defaultMenuType: MenuFormValues['menuType'] =
      createParentType === 'C' ? 'F' : createParentId === 0 ? 'M' : 'C';
    return {
      menuName: '',
      parentId: String(createParentId ?? 0),
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
  }, [createParentId, createParentType, editorState]);

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
        editorState.menu.id,
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
          id: editorState.menu.id,
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
