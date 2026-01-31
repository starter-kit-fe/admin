'use client';

import {
  useDictDataDeleteState,
  useDictManagementMutationCounter,
  useDictManagementRefresh,
} from '@/app/dashboard/system/dict/store';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removeDictData } from '../../api';
import { resolveErrorMessage } from '../../utils';

export function DictDataDeleteDialog() {
  const t = useTranslations('DictManagement');
  const { dataDeleteTarget, setDataDeleteTarget } = useDictDataDeleteState();
  const refresh = useDictManagementRefresh();
  const { beginMutation, endMutation } = useDictManagementMutationCounter();

  const deleteMutation = useMutation({
    mutationFn: ({ dictId, id }: { dictId: number; id: number }) =>
      removeDictData(dictId, id),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('toast.data.deleteSuccess'));
      setDataDeleteTarget(null);
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, t('toast.data.deleteError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  return (
    <DeleteConfirmDialog
      open={dataDeleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) {
          setDataDeleteTarget(null);
        }
      }}
      title={t('delete.data.title')}
      description={
        dataDeleteTarget
          ? t('delete.data.description', {
              name: dataDeleteTarget.dictData.dictLabel,
            })
          : t('delete.data.fallback')
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (dataDeleteTarget) {
          deleteMutation.mutate({
            dictId: dataDeleteTarget.dictType.id,
            id: dataDeleteTarget.dictData.id,
          });
        }
      }}
    />
  );
}
