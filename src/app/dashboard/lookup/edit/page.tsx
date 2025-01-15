'use client';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from '@/components/ui/form';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ILookUP } from '../_type';
import { put, get } from '../_api';
import Show from '@/components/show';
import { ID_LOOKUP_GROUP, ID_LOOKUP_LIST } from '@/lib/constant';
import { useEffect } from 'react';
import Loading from '@/app/dashboard/loading';

export default function Page() {
  const search = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = search.get('id') || '';

  const formSchema = z.object({
    value: z.string().min(1, { message: '值不能为空' }),
    label: z.string().min(1, { message: '标签不能为空' }),
    name: z.string().min(1, { message: '组值不能为空' }),
    remark: z
      .string()
      .nullable()
      .optional()
      .transform((val) => val || ''), // 修改这里
    sort: z.number().min(0, { message: '排序号必须大于等于0' }),
    status: z.number(),
    is_active: z.boolean(),
    is_default: z.boolean(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: '',
      label: '',
      name: search.get('group') || '',
      remark: '', // 确保有默认值
      sort: 0,
      is_active: false,
      is_default: false,
      status: 1,
    },
  });

  const { isLoading, data } = useQuery({
    queryKey: [id],
    queryFn: () => get(id),
  });

  useEffect(() => {
    if (data) {
      form.reset({
        value: data.value || '', // 确保有默认值
        label: data.label || '', // 确保有默认值
        name: data.group || '',
        remark: data.remark || '', // 确保有默认值
        sort: data.sort || 0,
        is_active: data?.status === 3 || data?.status === 1,
        is_default: data?.status === 3,
        status: data?.status || 1,
      });
    }
  }, [data, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ILookUP.putRequest) => put(search.get('id') || '', data),
    onSuccess() {
      form.reset();
      queryClient.invalidateQueries({ queryKey: [ID_LOOKUP_GROUP] });
      queryClient.invalidateQueries({ queryKey: [ID_LOOKUP_LIST] });
      router.push('/dashboard/lookup/list');
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const isDefault = values.is_default ? 3 : 1;
    values.status = values.is_active ? isDefault : 2;
    mutate(values);
  };

  // Textarea的字段计数器组件修改
  const TextareaCounter = ({ value }: { value: string }) => (
    <span className="text-sm text-muted-foreground absolute right-1 bottom-1">
      {`${value?.length || 0}/200`}
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto mt-5">
      <h2 className="text-2xl font-bold text-gray-700">
        编辑&quot;{data?.group?.toUpperCase()}&quot;
      </h2>
      <div className="text-sm text-muted-foreground">
        点击确认提交更新字典信息{' '}
      </div>
      <Show when={!isLoading} fallback={<Loading />}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 grid-cols-1 mt-8">
              {/* 字典信息 */}
              <div className="col-span-full">
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  字典信息
                </h3>
                <div className="grid gap-4 grid-cols-1 ">
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          标签
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="focus:ring-2 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required className="text-gray-700">
                          键值
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              {...field}
                              maxLength={200}
                              className="focus:ring-2 focus:ring-blue-500"
                              value={field.value || ''} // 确保有值
                            />
                            <Show when={!!field.value}>
                              <TextareaCounter value={field.value || ''} />
                            </Show>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 附加信息 */}
              <div className="col-span-full">
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  附加信息
                </h3>
                <div className="grid gap-4 grid-cols-1">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-700">状态</FormLabel>
                          <p className="text-sm text-gray-500">
                            启用或禁用该字典项
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_default"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 rounded-lg border">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-700">默认</FormLabel>
                          <p className="text-sm text-gray-500">
                            一组字典只能有一个默认值，设置当前值为默认值后，其他选项的将自动关闭默认值
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">备注</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              {...field}
                              maxLength={200}
                              className="focus:ring-2 focus:ring-blue-500"
                              value={field.value || ''} // 确保有值
                            />
                            <Show when={!!field.value}>
                              <TextareaCounter value={field.value || ''} />
                            </Show>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button disabled={isPending} type="submit">
                <Show when={!isPending} fallback="提交中...">
                  确认提交
                </Show>
              </Button>
            </div>
          </form>
        </Form>
      </Show>
    </div>
  );
}
