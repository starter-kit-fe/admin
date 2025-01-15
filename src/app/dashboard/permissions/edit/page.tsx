'use client';

import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDetail } from '../_hook';
import Loading from '@/app/dashboard/loading';
import Empty from '@/components/empty';
import Show from '@/components/show';

import MenuForm, {
  formSchema as MenuFormSchema,
} from '@/app/dashboard/permissions/edit/_components/forms/menu';
import FinderForm, {
  formSchema as FinderFormSchema,
} from '@/app/dashboard/permissions/edit/_components/forms/finder';
import ButtonForm, {
  formSchema as ButtonFormSchema,
} from '@/app/dashboard/permissions/edit/_components/forms/button';
import { toast } from 'sonner';
import { put } from '../_api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IPermissions } from '../_types';
import { ID_PERMISSION_LIST } from '@/lib/constant';

// 定义权限类型常量
const PERMISSION_TYPES = {
  MENU: 'M',
  FINDER: 'F',
  BUTTON: 'B',
} as const;

export default function PermissionEditPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const queryclient = useQueryClient();
  const router = useRouter();

  // 安全的类型转换和默认值
  const parsedId = Number(id) || 0;

  const { isLoading, data } = useDetail(parsedId);
  const { mutate, isPending } = useMutation({
    mutationFn: (data: IPermissions.postRequest) => put(parsedId, data),
    onSuccess: (data) => {
      if (data === 'ok') {
        toast.success('操作成功！');
        queryclient.invalidateQueries({ queryKey: [ID_PERMISSION_LIST] });
        router.push('/dashboard/permissions/list');
      }
    },
    onError: (err) => {
      toast.error('操作失败，请稍后再试！' + err.message);
    },
  });

  // 统一处理提交逻辑
  const handleSubmit = (
    values: z.infer<
      typeof MenuFormSchema | typeof FinderFormSchema | typeof ButtonFormSchema
    >
  ) => {
    if (!data?.type) return;

    mutate({
      ...values,
      sort: 1,
      type: Number(data.type.id),
      isFrame: 'isFrame' in values && values.isFrame ? 1 : 2,
      status: values.status ? 1 : 2,
    });
  };

  // 渲染不同类型的表单
  const renderPermissionForm = () => {
    if (!data?.type) return null;

    const commonProps = {
      isLoading: isPending,
      onSubmit: handleSubmit,
    };

    switch (data.type.value) {
      case PERMISSION_TYPES.MENU:
        return (
          <MenuForm
            {...commonProps}
            defaultValues={{
              ...data,
              status: data.status.id === 1,
              isFrame: data.isFrame.id === 1,
              parentId: data.parent.id,
            }}
          />
        );
      case PERMISSION_TYPES.FINDER:
        return (
          <FinderForm
            {...commonProps}
            defaultValues={{
              ...data,
              status: data.status.id === 1,
            }}
          />
        );
      case PERMISSION_TYPES.BUTTON:
        return (
          <ButtonForm
            {...commonProps}
            defaultValues={{
              ...data,
              status: data.status.id === 1,
            }}
          />
        );
      default:
        return <Empty />;
    }
  };

  return (
    <Show when={!isLoading} fallback={<Loading />}>
      <Show when={!!data?.name} fallback={<Empty />}>
        <div className="text-2xl font-bold mb-4">
          编辑&quot;{data?.name.toUpperCase() ?? ''}&quot;&nbsp;
        </div>
        {renderPermissionForm()}
      </Show>
    </Show>
  );
}
