'use client';

import {
  usePostManagementMutationCounter,
  usePostManagementRefresh,
  usePostManagementStore,
} from '@/app/dashboard/system/post/store';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { createPost, updatePost } from '../../api';
import type { PostFormValues } from '../../type';
import {
  computeNextSort,
  resolveErrorMessage,
  toCreatePayload,
  toFormValues,
  toUpdatePayload,
} from '../../utils';
import { PostEditorDialog } from './post-editor-dialog';

export function PostEditorManager() {
  const { editorState, closeEditor, posts, total } = usePostManagementStore();
  const refresh = usePostManagementRefresh();
  const { beginMutation, endMutation } = usePostManagementMutationCounter();

  const createMutation = useMutation({
    mutationFn: (values: PostFormValues) => {
      const nextSort = computeNextSort(posts, total);
      return createPost(toCreatePayload(values, nextSort));
    },
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('岗位创建成功');
      closeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '创建岗位失败，请稍后重试'));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: PostFormValues }) => {
      const sort =
        editorState.open && editorState.mode === 'edit'
          ? (editorState.post.postSort ?? 0)
          : 0;
      return updatePost(id, toUpdatePayload(values, sort));
    },
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('岗位信息已更新');
      closeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '更新岗位失败，请稍后重试'));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const mode: 'create' | 'edit' =
    editorState.open && editorState.mode === 'edit' ? 'edit' : 'create';

  const editorDefaultValues = useMemo<PostFormValues | undefined>(() => {
    if (!editorState.open || editorState.mode === 'create') {
      return undefined;
    }
    return toFormValues(editorState.post);
  }, [editorState]);

  const handleSubmit = (values: PostFormValues) => {
    if (!editorState.open) return;
    if (editorState.mode === 'edit') {
      updateMutation.mutate({
        id: editorState.post.id,
        values,
      });
      return;
    }
    createMutation.mutate(values);
  };

  return (
    <PostEditorDialog
      mode={mode}
      open={editorState.open}
      defaultValues={editorDefaultValues}
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
