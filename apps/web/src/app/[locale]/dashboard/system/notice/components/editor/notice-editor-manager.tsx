'use client';

import {
  useNoticeManagementMutationCounter,
  useNoticeManagementRefresh,
  useNoticeManagementStore,
} from '@/app/dashboard/system/notice/store';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from 'sonner';

import {
  type CreateNoticePayload,
  type UpdateNoticePayload,
  createNotice,
  updateNotice,
} from '../../api';
import type { NoticeFormValues } from '../../type';
import { resolveErrorMessage, toFormValues } from '../../utils';
import { NoticeEditorDialog } from './notice-editor-dialog';
import { useTranslations } from 'next-intl';

export function NoticeEditorManager() {
  const t = useTranslations('NoticeManagement');
  const { editorState, closeEditor } = useNoticeManagementStore();
  const refresh = useNoticeManagementRefresh();
  const { beginMutation, endMutation } = useNoticeManagementMutationCounter();

  const createMutation = useMutation({
    mutationFn: (payload: CreateNoticePayload) => createNotice(payload),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.createSuccess'));
      closeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, t('toast.createError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateNoticePayload;
    }) => updateNotice(id, payload),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.updateSuccess'));
      closeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, t('toast.updateError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const mode: 'create' | 'edit' =
    editorState.open && editorState.mode === 'edit' ? 'edit' : 'create';

  const defaultValues = useMemo<NoticeFormValues | undefined>(() => {
    if (!editorState.open || editorState.mode === 'create') {
      return undefined;
    }
    return toFormValues(editorState.notice);
  }, [editorState]);

  const submitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (values: NoticeFormValues) => {
    const payload: CreateNoticePayload = {
      noticeTitle: values.noticeTitle.trim(),
      noticeType: values.noticeType,
      noticeContent: values.noticeContent.trim(),
      status: values.status,
      remark: values.remark.trim() ? values.remark.trim() : undefined,
    };
    if (editorState.open && editorState.mode === 'edit') {
      updateMutation.mutate({
        id: editorState.notice.noticeId,
        payload,
      });
      return;
    }
    createMutation.mutate(payload);
  };

  return (
    <NoticeEditorDialog
      mode={mode}
      open={editorState.open}
      defaultValues={defaultValues}
      submitting={submitting}
      onOpenChange={(open) => {
        if (!open) {
          closeEditor();
        }
      }}
      onSubmit={handleSubmit}
    />
  );
}
