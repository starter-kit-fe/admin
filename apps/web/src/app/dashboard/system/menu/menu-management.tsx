'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeleteConfirmDialog } from '../user/components/delete-confirm-dialog';

import {
  createMenu,
  listMenuTree,
  removeMenu,
  reorderMenus,
  updateMenu,
} from './api';
import type {
  CreateMenuPayload,
  MenuFormValues,
  MenuOrderUpdate,
  MenuTreeNode,
} from './type';
import { MenuEditorDialog, type MenuParentOption } from './components/menu-editor-dialog';
import { MenuTreeView } from './components/menu-tree-view';

const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '显示' },
  { value: '1', label: '隐藏' },
] as const;

type StatusValue = (typeof STATUS_TABS)[number]['value'];

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

type EditorState =
  | { open: false }
  | { open: true; mode: 'create'; parentId: number }
  | { open: true; mode: 'edit'; menu: MenuTreeNode };

function toFormValues(menu: MenuTreeNode): MenuFormValues {
  return {
    menuName: menu.menuName ?? '',
    parentId: String(menu.parentId ?? 0),
    orderNum: menu.orderNum != null ? String(menu.orderNum) : '',
    path: menu.path ?? '',
    component: menu.component ?? '',
    query: menu.query ?? '',
    routeName: menu.routeName ?? '',
    isFrame: Boolean(menu.isFrame),
    isCache: Boolean(menu.isCache),
    menuType: menu.menuType as MenuFormValues['menuType'],
    visible: menu.visible as MenuFormValues['visible'],
    status: menu.status as MenuFormValues['status'],
    perms: menu.perms ?? '',
    icon: menu.icon ?? '#',
    remark: menu.remark ?? '',
  };
}

function toCreatePayload(values: MenuFormValues): CreateMenuPayload {
  const parentId = Number(values.parentId) || 0;
  const orderNum = values.orderNum.trim() === '' ? 0 : Number(values.orderNum);
  return {
    menuName: values.menuName.trim(),
    parentId,
    orderNum,
    path: values.path.trim(),
    component: values.component?.trim() || undefined,
    query: values.query?.trim() || undefined,
    routeName: values.routeName.trim(),
    isFrame: values.isFrame,
    isCache: values.isCache,
    menuType: values.menuType,
    visible: values.visible,
    status: values.status,
    perms: values.perms?.trim() || undefined,
    icon: values.icon.trim() || '#',
    remark: values.remark?.trim() || undefined,
  };
}

function buildParentOptions(nodes: MenuTreeNode[], excludeIds: Set<number>): MenuParentOption[] {
  const options: MenuParentOption[] = [{ value: '0', label: '顶级菜单' }];
  const walk = (items: MenuTreeNode[], depth: number) => {
    items.forEach((item) => {
      if (excludeIds.has(item.menuId)) {
        return;
      }
      options.push({
        value: String(item.menuId),
        label: `${'—'.repeat(depth)} ${item.menuName}`,
      });
      if (item.children && item.children.length > 0) {
        walk(item.children, depth + 1);
      }
    });
  };
  walk(nodes, 1);
  return options;
}

function collectDescendantIds(node?: MenuTreeNode): number[] {
  if (!node?.children) return [];
  const result: number[] = [];
  const stack = [...node.children];
  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current.menuId);
    if (current.children) {
      stack.push(...current.children);
    }
  }
  return result;
}

function reorderTree(nodes: MenuTreeNode[], parentId: number, orderedIds: number[]): MenuTreeNode[] {
  if (parentId === 0) {
    const map = new Map(nodes.map((node) => [node.menuId, node]));
    return orderedIds
      .map((id, index) => {
        const current = map.get(id);
        if (!current) return null;
        return {
          ...current,
          orderNum: index + 1,
          children: current.children ? [...current.children] : undefined,
        };
      })
      .filter(Boolean) as MenuTreeNode[];
  }
  return nodes.map((node) => {
    if (node.menuId === parentId) {
      const childMap = new Map((node.children ?? []).map((child) => [child.menuId, child]));
      const newChildren = orderedIds
        .map((id, index) => {
          const current = childMap.get(id);
          if (!current) return null;
          return {
            ...current,
            orderNum: index + 1,
            children: current.children ? [...current.children] : undefined,
          };
        })
        .filter(Boolean) as MenuTreeNode[];
      return {
        ...node,
        children: newChildren,
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: reorderTree(node.children, parentId, orderedIds),
      };
    }
    return node;
  });
}

export function MenuManagement() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusValue>('all');
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 400);

  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([]);
  const [editorState, setEditorState] = useState<EditorState>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<MenuTreeNode | null>(null);

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
  }, [menuQuery.data]);

  const invalidateMenus = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['system', 'menus'] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: createMenu,
    onSuccess: () => {
      toast.success('菜单创建成功');
      setEditorState({ open: false });
      invalidateMenus();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '创建菜单失败，请稍后再试';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ menuId, payload }: { menuId: number; payload: CreateMenuPayload }) =>
      updateMenu(menuId, payload),
    onSuccess: () => {
      toast.success('菜单已更新');
      setEditorState({ open: false });
      invalidateMenus();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '更新菜单失败，请稍后再试';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (menuId: number) => removeMenu(menuId),
    onSuccess: () => {
      toast.success('菜单已删除');
      setDeleteTarget(null);
      invalidateMenus();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '删除菜单失败，请稍后再试';
      toast.error(message);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (payload: MenuOrderUpdate[]) => reorderMenus(payload),
    onSuccess: () => {
      toast.success('菜单排序已更新');
      invalidateMenus();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '更新排序失败，请稍后再试';
      toast.error(message);
      invalidateMenus();
    },
  });

  const handleStatusChange = (value: string) => {
    setStatus(value as StatusValue);
  };

  const handleRefresh = () => {
    invalidateMenus();
  };

  const handleOpenCreate = (parentId: number) => {
    setEditorState({ open: true, mode: 'create', parentId });
  };

  const handleOpenEdit = (menu: MenuTreeNode) => {
    setEditorState({ open: true, mode: 'edit', menu });
  };

  const handleEditorSubmit = (values: MenuFormValues) => {
    const payload = toCreatePayload(values);
    if (editorState.open && editorState.mode === 'edit') {
      updateMutation.mutate({ menuId: editorState.menu.menuId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleOpenDelete = (menu: MenuTreeNode) => {
    setDeleteTarget(menu);
  };

  const editorDefaultValues: MenuFormValues | undefined = useMemo(() => {
    if (!editorState.open) return undefined;
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

  const parentOptions = useMemo(() => {
    if (!editorState.open) {
      return [{ value: '0', label: '顶级菜单' }];
    }
    if (editorState.mode === 'edit') {
      const excludeIds = new Set<number>([editorState.menu.menuId, ...collectDescendantIds(editorState.menu)]);
      return buildParentOptions(menuTree, excludeIds);
    }
    return buildParentOptions(menuTree, new Set<number>());
  }, [editorState, menuTree]);

  const handleReorder = (parentId: number, orderedIds: number[]) => {
    setMenuTree((prev) => reorderTree(prev, parentId, orderedIds));
    const payload: MenuOrderUpdate[] = orderedIds.map((id, index) => ({
      menuId: id,
      parentId,
      orderNum: index + 1,
    }));
    reorderMutation.mutate(payload);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 pb-10">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold">菜单管理</CardTitle>
            <CardDescription>维护系统菜单结构，支持新增、编辑和拖拽排序。</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRefresh}
                disabled={menuQuery.isFetching}
              >
                刷新
              </Button>
              <Button type="button" onClick={() => handleOpenCreate(0)}>
                新增顶级菜单
              </Button>
            </div>
            <Input
              className="sm:w-64"
              placeholder="搜索菜单名称"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={status} onValueChange={handleStatusChange}>
            <TabsList>
              {STATUS_TABS.map((tab) => (
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
          <CardTitle className="text-lg font-semibold">菜单列表</CardTitle>
          <CardDescription>支持拖拽调整同级菜单顺序，操作项可快速新增、编辑或删除。</CardDescription>
        </CardHeader>
        <CardContent>
          {menuQuery.isError ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-sm text-destructive">
              加载菜单失败，请稍后重试。
              <Button type="button" variant="outline" size="sm" onClick={() => menuQuery.refetch()}>
                重新加载
              </Button>
            </div>
          ) : (
            <MenuTreeView
              nodes={menuTree}
              loading={menuQuery.isLoading}
              onAddChild={(parent) => handleOpenCreate(parent.menuId)}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onReorder={handleReorder}
            />
          )}
        </CardContent>
      </Card>

      <MenuEditorDialog
        mode={editorState.open ? (editorState.mode === 'edit' ? 'edit' : 'create') : 'create'}
        open={editorState.open}
        defaultValues={editorDefaultValues}
        parentOptions={parentOptions}
        submitting={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditorState({ open: false });
          }
        }}
        onSubmit={handleEditorSubmit}
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        title="删除菜单"
        description={
          deleteTarget
            ? `确定要删除菜单「${deleteTarget.menuName}」吗？如有子菜单将同时删除。`
            : '确认删除所选菜单吗？'
        }
        loading={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.menuId);
          }
        }}
      />
    </div>
  );
}
