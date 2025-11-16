'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removeDictType } from '../../api';
import {
  useDictManagementMutationCounter,
  useDictManagementRefresh,
  useDictTypeDeleteState,
} from '@/app/dashboard/system/dict/store';
import { resolveErrorMessage } from '../../utils';

export function DictTypeDeleteDialog() {
  const { typeDeleteTarget, setTypeDeleteTarget } = useDictTypeDeleteState();
  const refresh = useDictManagementRefresh();
  const { beginMutation, endMutation } =
    useDictManagementMutationCounter();
  const tToast = useTranslations('DictManagement.toast.type');
  const tDelete = useTranslations('DictManagement.delete.type');

  const deleteMutation = useMutation({
    mutationFn: (dictId: number) => removeDictType(dictId),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(tToast('deleteSuccess'));
      setTypeDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, tToast('deleteError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  return (
    <DeleteConfirmDialog
      open={typeDeleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) {
          setTypeDeleteTarget(null);
        }
      }}
      title={tDelete('title')}
      description={
        typeDeleteTarget
          ? tDelete('description', { name: typeDeleteTarget.dictName })
          : tDelete('fallback')
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (typeDeleteTarget) {
          deleteMutation.mutate(typeDeleteTarget.dictId);
        }
      }}
    />
  );
}
