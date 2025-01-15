import { patch } from '../../../_api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ID_PERMISSION_LIST } from '@/lib/constant';
import { Switch } from '@/components/ui/switch';

const useUpdatePermissionStatus = (id: number, currentStatusId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => patch(id, currentStatusId === 1 ? 2 : 1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ID_PERMISSION_LIST] });
    },
  });
};
interface StatusSwitchProps {
  id: number;
  status: number;
}
export default function Page({ id, status }: StatusSwitchProps) {
  const { mutate } = useUpdatePermissionStatus(id, status);
  return <Switch checked={status === 1} onCheckedChange={() => mutate()} />;
}
