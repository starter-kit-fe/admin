'use client';

import { useState } from 'react';
import * as z from 'zod';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID_LOOKUP_LIST, ID_PERMISSION_LIST } from '@/lib/constant';
import { getList } from '@/app/dashboard/lookup/_api';
import { post } from '../_api';
import { IPermissions } from '../_types';
import Show from '@/components/show';
import Loading from '../../loading';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MenuForm, {
  formSchema as MenuFormSchema,
} from './_components/forms/menu';
import FinderForm, {
  formSchema as FinderFormSchema,
} from './_components/forms/finder';
import ButtonForm, {
  formSchema as ButtonFormSchema,
} from './_components/forms/button';
export default function AddPermissionForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [permissionType, setPermissionType] = useState('M');

  const { data, isLoading } = useQuery({
    queryKey: [ID_LOOKUP_LIST],
    queryFn: () => getList({ value: '权限类型' }),
  });
  const { mutate, isPending } = useMutation({
    mutationFn: (data: IPermissions.postRequest) => post(data),
    onSuccess(response) {
      if (response === 'ok') {
        toast.success('操作成功！');
        queryClient.invalidateQueries({ queryKey: [ID_PERMISSION_LIST] });
        router.push('/dashboard/permissions/list');
      }
    },
    onError(err) {
      toast.error(`添加失败：${err.message}`);
    },
  });
  const handleSumbit = (
    val:
      | z.infer<typeof MenuFormSchema>
      | z.infer<typeof FinderFormSchema>
      | z.infer<typeof ButtonFormSchema>
  ) => {
    const typeID = data?.list?.find((it) => it.value === permissionType)?.id;
    if (!typeID) return;
    mutate({
      ...val,
      sort: 1,
      type: typeID,
      isFrame: (val as z.infer<typeof MenuFormSchema>).isFrame ? 1 : 2,
      status: val.status ? 1 : 2,
    });
  };

  return (
    <div className="py-5 px-2 md:px-0">
      <title>新增权限</title>
      <h2 className="text-2xl font-bold text-gray-700">新增权限</h2>
      <div className="text-sm text-muted-foreground">
        请填写以下信息来创建新的权限项
      </div>
      <br />
      <Show when={Boolean(!isLoading)} fallback={<Loading />}>
        <Tabs defaultValue={permissionType}>
          <TabsList className="grid grid-cols-3">
            {data?.list?.map((it) => (
              <TabsTrigger
                key={it.id}
                value={it.value}
                onClick={() => setPermissionType(it.value)}
              >
                {it.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <br />
          <TabsContent value="M" hidden={permissionType !== 'M'}>
            <MenuForm isLoading={isPending} onSubmit={handleSumbit} />
          </TabsContent>
          <TabsContent value="F" hidden={permissionType !== 'F'}>
            <FinderForm isLoading={isPending} onSubmit={handleSumbit} />
          </TabsContent>
          <TabsContent value="B" hidden={permissionType !== 'B'}>
            <ButtonForm isLoading={isPending} onSubmit={handleSumbit} />
          </TabsContent>
        </Tabs>
      </Show>
    </div>
  );
}
