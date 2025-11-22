'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removeDictType } from '../../api';
import {
  useDictManagementMutationCounter,
  useDictManagementRefresh,
  useDictTypeDeleteState,
} from '@/app/dashboard/system/dict/store';
import { resolveErrorMessage } from '../../utils';

export function DictTypeDeleteDialog() {
  const t = useTranslations('DictManagement');
  const { typeDeleteTarget, setTypeDeleteTarget } = useDictTypeDeleteState();
  const refresh = useDictManagementRefresh();
  const { beginMutation, endMutation } =
    useDictManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: (dictId: number) => removeDictType(dictId),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.type.deleteSuccess'));
      setTypeDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, t('toast.type.deleteError')));
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
      title={t('delete.type.title')}
      description={
        typeDeleteTarget
          ? t('delete.type.description', { name: typeDeleteTarget.dictName })
          : t('delete.type.fallback')
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
