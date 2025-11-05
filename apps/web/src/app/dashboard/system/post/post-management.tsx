'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { PaginationToolbar } from '@/components/pagination/pagination-toolbar';

import { DeleteConfirmDialog } from '../user/components/delete-confirm-dialog';
import { SelectionBanner } from '@/components/selection-banner';

import { createPost, listPosts, removePost, updatePost } from './api';
import { AppliedFilters, type PostFilterChip } from './components/applied-filters';
import { PostManagementFilters } from './components/post-management-filters';
import { PostManagementHeader } from './components/post-management-header';
import { PostEditorDialog } from './components/post-editor-dialog';
import { PostTable } from './components/post-table';
import type {
  CreatePostPayload,
  Post,
  PostFormValues,
  PostListResponse,
  UpdatePostPayload,
} from './type';

const STATUS_TABS = [
  { value: 'all', label: '全部', activeColor: 'bg-slate-900 text-white' },
  { value: '0', label: '在岗', activeColor: 'bg-emerald-500 text-white' },
  { value: '1', label: '停用', activeColor: 'bg-rose-500 text-white' },
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

type StatusValue = (typeof STATUS_TABS)[number]['value'];

type EditorState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; post: Post };

interface DeleteState {
  open: boolean;
  post?: Post;
}

function useDebouncedValue<T>(value: T, delay: number): T {
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

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

function toFormValues(post: Post): PostFormValues {
  return {
    postCode: post.postCode ?? '',
    postName: post.postName ?? '',
    status: post.status ?? '0',
    remark: post.remark ?? '',
  };
}

function normalizeOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function toCreatePayload(values: PostFormValues, sort: number): CreatePostPayload {
  return {
    postCode: values.postCode.trim(),
    postName: values.postName.trim(),
    postSort: Number.isNaN(sort) ? 0 : sort,
    status: values.status,
    remark: normalizeOptional(values.remark) ?? null,
  };
}

function toUpdatePayload(values: PostFormValues, sort: number): UpdatePostPayload {
  return toCreatePayload(values, sort);
}

function computeNextSort(posts: Post[], total: number): number {
  let max = total;
  posts.forEach((item) => {
    if (item.postSort != null && item.postSort > max) {
      max = item.postSort;
    }
  });
  return max + 1;
}

export function PostManagement() {
  const [status, setStatus] = useState<StatusValue>('all');
  const [postNameInput, setPostNameInput] = useState('');
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [editorState, setEditorState] = useState<EditorState>({ open: false });
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const debouncedPostName = useDebouncedValue(postNameInput.trim(), 350);

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [
      'system',
      'posts',
      'list',
      status,
      debouncedPostName,
      pageNum,
      pageSize,
    ],
    queryFn: () =>
      listPosts({
        status: status === 'all' ? undefined : status,
        postName: debouncedPostName || undefined,
        pageNum,
        pageSize,
      }),
    keepPreviousData: true,
  });

  const data = query.data;
  const posts = data?.items ?? [];
  const total = data?.total ?? 0;

  const statusCountQueryConfigs = useMemo(
    () =>
    STATUS_TABS.filter((tab) => tab.value !== 'all').map((tab) => ({
        status: tab.value,
        query: {
          queryKey: [
            'system',
            'posts',
            'count',
            tab.value,
            debouncedPostName,
          ],
          queryFn: () =>
            listPosts({
              status: tab.value,
              postName: debouncedPostName || undefined,
              pageNum: 1,
              pageSize: 1,
            }),
          select: (response: PostListResponse) => response.total,
        },
      })),
    [debouncedPostName],
  );

  const statusCountQueries = useQueries({
    queries: statusCountQueryConfigs.map(({ query }) => query),
  });

  const statusCounts = useMemo(() => {
    const result: Record<string, number> = {};
    result['all'] = total;
    statusCountQueryConfigs.forEach(({ status }, index) => {
      result[status] = statusCountQueries[index]?.data ?? 0;
    });
    return result;
  }, [statusCountQueries, statusCountQueryConfigs, total]);

  const statusTabsWithCount = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        value: tab.value,
        label: tab.label,
        count: statusCounts[tab.value] ?? 0,
        activeColor: tab.activeColor,
      })),
    [statusCounts],
  );

  const appliedFilterChips = useMemo<PostFilterChip[]>(() => {
    const chips: PostFilterChip[] = [];
    if (status !== 'all') {
      const currentTab = STATUS_TABS.find((tab) => tab.value === status);
      chips.push({
        key: 'status',
        label: '状态',
        value: currentTab?.label ?? status,
      });
    }
    const keyword = postNameInput.trim();
    if (keyword) {
      chips.push({ key: 'postName', label: '岗位名称', value: keyword });
    }
    return chips;
  }, [postNameInput, status]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (posts.length === 0) {
        return prev.size === 0 ? prev : new Set();
      }
      const next = new Set<number>();
      posts.forEach((post) => {
        if (prev.has(post.postId)) {
          next.add(post.postId);
        }
      });
      if (next.size === prev.size) {
        let identical = true;
        for (const id of next) {
          if (!prev.has(id)) {
            identical = false;
            break;
          }
        }
        if (identical) {
          return prev;
        }
      }
      return next;
    });
  }, [posts]);

  useEffect(() => {
    if (query.isLoading || query.isFetching) {
      return;
    }
    if (posts.length === 0 && total > 0 && pageNum > 1) {
      const lastPage = Math.max(1, Math.ceil(total / pageSize));
      if (pageNum !== lastPage) {
        setPageNum(lastPage);
      }
    }
  }, [pageNum, pageSize, posts.length, query.isFetching, query.isLoading, total]);

  const invalidatePosts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['system', 'posts'] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (payload: CreatePostPayload) => createPost(payload),
    onSuccess: () => {
      toast.success('新增岗位成功');
      setEditorState({ open: false });
      invalidatePosts();
    },
    onError: (error: unknown) => {
      toast.error(resolveErrorMessage(error, '新增岗位失败'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      postId,
      payload,
    }: {
      postId: number;
      payload: UpdatePostPayload;
    }) => updatePost(postId, payload),
    onSuccess: () => {
      toast.success('岗位信息已更新');
      setEditorState({ open: false });
      invalidatePosts();
    },
    onError: (error: unknown) => {
      toast.error(resolveErrorMessage(error, '更新岗位失败'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: number) => removePost(postId),
    onSuccess: () => {
      toast.success('岗位已删除');
      setDeleteState({ open: false });
      invalidatePosts();
    },
    onError: (error: unknown) => {
      toast.error(resolveErrorMessage(error, '删除岗位失败'));
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => removePost(id)));
    },
    onSuccess: () => {
      toast.success('批量删除成功');
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      invalidatePosts();
    },
    onError: (error: unknown) => {
      toast.error(resolveErrorMessage(error, '批量删除失败'));
    },
  });

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value as StatusValue);
    setPageNum(1);
    setSelectedIds(new Set());
  }, []);

  const handlePostNameChange = useCallback((value: string) => {
    setPostNameInput(value);
    setPageNum(1);
  }, []);

  const handleAddPost = useCallback(() => {
    setEditorState({ open: true, mode: 'create' });
  }, []);

  const handleRemoveFilter = useCallback(
    (key: string) => {
      if (key === 'status') {
        handleStatusChange('all');
        return;
      }
      if (key === 'postName') {
        setPostNameInput('');
        setPageNum(1);
        setSelectedIds(new Set());
      }
    },
    [handleStatusChange, setPageNum, setPostNameInput, setSelectedIds],
  );

  const handleEditPost = useCallback((post: Post) => {
    setEditorState({ open: true, mode: 'edit', post });
  }, []);

  const handleDeletePost = useCallback((post: Post) => {
    setDeleteState({ open: true, post });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteState.post) {
      return;
    }
    deleteMutation.mutate(deleteState.post.postId);
  }, [deleteMutation, deleteState.post]);

  const handleDeleteOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setDeleteState({ open: false });
    }
  }, []);

  const handleEditorOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setEditorState({ open: false });
    }
  }, []);

  const handleEditorSubmit = useCallback(
    (values: PostFormValues) => {
      if (!editorState.open) {
        return;
      }
      if (editorState.mode === 'create') {
        const sort = computeNextSort(posts, total);
        createMutation.mutate(toCreatePayload(values, sort));
        return;
      }
      updateMutation.mutate({
        postId: editorState.post.postId,
        payload: toUpdatePayload(values, editorState.post.postSort ?? 0),
      });
    },
    [createMutation, editorState, posts, total, updateMutation],
  );

  const handlePageChange = useCallback((nextPage: number) => {
    setPageNum(nextPage);
    setSelectedIds(new Set());
  }, []);

  const handlePageSizeChange = useCallback((nextSize: number) => {
    setPageNum(1);
    setPageSize(nextSize);
    setSelectedIds(new Set());
  }, []);

  const handleToggleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(posts.map((post) => post.postId)));
    } else {
      setSelectedIds(new Set());
    }
  }, [posts]);

  const handleToggleSelect = useCallback((postId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  }, []);

  const editorDefaults = useMemo<PostFormValues | undefined>(() => {
    if (!editorState.open) {
      return undefined;
    }
    if (editorState.mode === 'create') {
      return {
        postCode: '',
        postName: '',
        status: '0',
        remark: '',
      };
    }
    return toFormValues(editorState.post);
  }, [editorState]);

  const selectedCount = selectedIds.size;
  const isAllSelected =
    posts.length > 0 && posts.every((post) => selectedIds.has(post.postId));
  const headerCheckboxState = isAllSelected
    ? true
    : selectedCount > 0
      ? ('indeterminate' as const)
      : false;

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const isRefreshing = query.isFetching;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <PostManagementHeader
        onRefresh={invalidatePosts}
        onCreate={handleAddPost}
        disableActions={isMutating}
        isRefreshing={isRefreshing}
      />

      <PostManagementFilters
        status={status}
        tabs={statusTabsWithCount}
        onStatusChange={handleStatusChange}
        postName={postNameInput}
        onPostNameChange={handlePostNameChange}
      />

      <AppliedFilters items={appliedFilterChips} onRemove={handleRemoveFilter} />

      <SelectionBanner
        count={selectedCount}
        onClear={() => setSelectedIds(new Set())}
        onBulkDelete={() => setBulkDeleteOpen(true)}
      />

      <PostTable
        rows={posts}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        selectedIds={selectedIds}
        headerCheckboxState={headerCheckboxState}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelect={handleToggleSelect}
        loading={query.isLoading}
        isError={query.isError}
      />

      <PaginationToolbar
        totalItems={total}
        currentPage={pageNum}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        disabled={isRefreshing}
      />

      <PostEditorDialog
        mode={editorState.open ? editorState.mode : 'create'}
        open={editorState.open}
        defaultValues={editorDefaults}
        submitting={
          editorState.open
            ? editorState.mode === 'create'
              ? createMutation.isPending
              : updateMutation.isPending
            : false
        }
        onOpenChange={handleEditorOpenChange}
        onSubmit={handleEditorSubmit}
      />

      <DeleteConfirmDialog
        open={deleteState.open}
        onOpenChange={handleDeleteOpenChange}
        loading={deleteMutation.isPending}
        title="删除岗位"
        description={
          deleteState.post
            ? `确认删除「${deleteState.post.postName}」岗位吗？`
            : '确认删除该岗位吗？'
        }
        onConfirm={handleDeleteConfirm}
        confirmLabel="确认删除"
      />

      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBulkDeleteOpen(false);
          }
        }}
        loading={bulkDeleteMutation.isPending}
        title="批量删除岗位"
        description={
          selectedCount > 0
            ? `确认删除选中的 ${selectedCount} 个岗位吗？`
            : '请选择要删除的岗位'
        }
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
        confirmLabel="确认删除"
      />
    </div>
  );
}
