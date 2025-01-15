import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ID_LOOKUP_GROUP, ID_LOOKUP_LIST } from '@/lib/constant';
import { patchStatus } from '../../../_api';

// 改进枚举的定义和使用
export enum StatusMode {
  GROUP = 'group', // 对应原来的 active 场景
  STATUS = 'status', // 对应原来的 status 场景
}

// 定义状态映射类型
interface StatusMapping {
  left: string;
  right: string;
}

// 状态映射配置
const STATUS_CONFIG: Record<StatusMode, StatusMapping> = {
  [StatusMode.GROUP]: { left: '3', right: '1' },
  [StatusMode.STATUS]: { left: '1', right: '2' },
};

// 定义组件属性接口
interface StatusSwitchProps {
  id: number;
  checked: boolean;
  mode: StatusMode; // 使用更语义化的 mode 替代 type
}

// 自定义 hook 用于状态更新
const useUpdateStatusSwitch = (id: number, mode: StatusMode) => {
  const queryClient = useQueryClient();
  const { left, right } = STATUS_CONFIG[mode];

  return useMutation({
    mutationFn: (newStatus: boolean) =>
      patchStatus(`${id}`, newStatus ? left : right),
    onSuccess: () => {
      // 使用更清晰的注释
      // 更新成功后刷新相关数据缓存
      queryClient.invalidateQueries({ queryKey: [ID_LOOKUP_GROUP] });
      queryClient.invalidateQueries({ queryKey: [ID_LOOKUP_LIST] });
    },
  });
};

export default function StatusSwitch({
  id,
  checked,
  mode = StatusMode.GROUP,
}: StatusSwitchProps) {
  const { mutate, isPending } = useUpdateStatusSwitch(id, mode);

  // 使用条件渲染替代 Show 组件
  if (isPending) {
    return <Loader2 className="animate-spin" />;
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={(val) => mutate(val)}
      disabled={isPending}
    />
  );
}
