'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '@/app/dashboard/system/user/components/delete-confirm-dialog';
import { removeNotice } from '../../api';
import {
  useNoticeManagementMutationCounter,
  useNoticeManagementRefresh,
  useNoticeManagementStore,
} from '@/app/dashboard/system/notice/store';
import { resolveErrorMessage } from '../../utils';

export function NoticeDeleteDialog() {
  const { deleteTarget, setDeleteTarget } = useNoticeManagementStore();
  const refresh = useNoticeManagementRefresh();
  const { beginMutation, endMutation } =
    useNoticeManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeNotice(id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('公告已删除');
      setDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '删除公告失败'));
    },
    onSettled: () => {
      endMutation();
    },
  });

  return (
    <DeleteConfirmDialog
      open={deleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) {
          setDeleteTarget(null);
        }
      }}
      title="删除公告"
      description={
        deleteTarget
          ? `确定要删除公告「${deleteTarget.noticeTitle}」吗？`
          : '确认删除所选公告吗？'
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (deleteTarget) {
          deleteMutation.mutate(deleteTarget.noticeId);
        }
      }}
    />
  );
}
