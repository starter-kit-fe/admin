'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { DeleteConfirmDialog } from '../../../user/components/delete-confirm-dialog';
import { removeDictData } from '../../api';
import {
  useDictDataDeleteState,
  useDictManagementMutationCounter,
  useDictManagementRefresh,
} from '@/app/dashboard/system/dict/store';
import { resolveErrorMessage } from '../../utils';

export function DictDataDeleteDialog() {
  const { dataDeleteTarget, setDataDeleteTarget } = useDictDataDeleteState();
  const refresh = useDictManagementRefresh();
  const { beginMutation, endMutation } =
    useDictManagementMutationCounter();
  const tToast = useTranslations('DictManagement.toast.data');
  const tDelete = useTranslations('DictManagement.delete.data');

  const deleteMutation = useMutation({
    mutationFn: ({
      dictTypeId,
      dictCode,
    }: {
      dictTypeId: number;
      dictCode: number;
    }) => removeDictData(dictTypeId, dictCode),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(tToast('deleteSuccess'));
      setDataDeleteTarget(null);
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
      open={dataDeleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) {
          setDataDeleteTarget(null);
        }
      }}
      title={tDelete('title')}
      description={
        dataDeleteTarget
          ? tDelete('description', {
              name: dataDeleteTarget.dictData.dictLabel,
            })
          : tDelete('fallback')
      }
      loading={deleteMutation.isPending}
      onConfirm={() => {
        if (dataDeleteTarget) {
          deleteMutation.mutate({
            dictTypeId: dataDeleteTarget.dictType.dictId,
            dictCode: dataDeleteTarget.dictData.dictCode,
          });
        }
      }}
    />
  );
}
