'use client';
import { del } from '../../_api';
import { ID_LOOKUP_GROUP, ID_LOOKUP_LIST } from '@/lib/constant';
import { toast } from 'sonner';
import { useStore } from '../../_store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DeleteDialog from '@/components/delete-dialog';

export default function Page() {
  const queryClient = useQueryClient();
  const { currentLookup, removeCurrentLookup } = useStore();
  const { mutate, isPending } = useMutation({
    mutationFn: () => del(`${currentLookup?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ID_LOOKUP_GROUP] });
      queryClient.invalidateQueries({ queryKey: [ID_LOOKUP_LIST] });
      toast.success('操作成功');
      removeCurrentLookup();
    },
  });

  return (
    <DeleteDialog
      open={!!currentLookup}
      title={`${currentLookup?.label}`}
      loading={isPending}
      onOk={mutate}
      onCancel={removeCurrentLookup}
    />
  );
}
