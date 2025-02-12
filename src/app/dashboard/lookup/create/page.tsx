'use client';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ILookUP } from '../_type';
import { post } from '../_api';
import Show from '@/components/show';
import { ID_LOOKUP_LIST, ID_LOOKUP_GROUP } from '@/lib/constant';
import { toast } from 'sonner';

export default function Page() {
  const search = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const formSchema = z.object({
    value: z.string().min(1, { message: '值不能为空' }),
    label: z.string().min(1, { message: '标签不能为空' }),
    name: z.string().min(1, { message: '组值不能为空' }),
    remark: z.string().optional(),
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
      remark: '',
      sort: search.get('total') ? Number(search.get('total')) : 1,
      is_active: true,
      is_default: false,
      status: 1,
    },
  });
  const { mutate, isPending } = useMutation({
    mutationFn: (data: ILookUP.postRequest) => post(data),
    onSuccess() {
      form.reset();
      queryClient.invalidateQueries({ queryKey: [ID_LOOKUP_GROUP] });
      queryClient.invalidateQueries({ queryKey: [ID_LOOKUP_LIST] });
      router.push('/dashboard/lookup');
    },
    onError(err) {
      toast.error(err.message);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const isDefault = values.is_default ? 3 : 1;
    values.status = values.is_active ? isDefault : 2;
    mutate(values);
  };

  return (
    <div>
      <title>新增字典</title>
      <h2 className="text-2xl font-bold text-gray-700">新增字典</h2>
      <div className="text-sm text-muted-foreground">
        请填写以下信息来创建新的字典项
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-8">
            {/* 分组信息 */}
            <div className="col-span-full">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                分组信息
              </h3>
              <div className="grid gap-4 grid-cols-1 ">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        名称
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
              </div>
            </div>
            {/* 字典信息 */}
            <div className="col-span-full">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                字典信息
              </h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
                        <Input
                          {...field}
                          className="focus:ring-2 focus:ring-blue-500"
                        />
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
                          开启后默认值为当前项且在该组其他项都被充值卡为非默认值
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
                        <Textarea
                          {...field}
                          className="focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        />
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
    </div>
  );
}
