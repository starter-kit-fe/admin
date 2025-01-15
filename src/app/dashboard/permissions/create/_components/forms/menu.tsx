'use client';

import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import Show from '@/components/show';
import Loading from '@/app/dashboard/loading';
// import { ParentSeleted } from "../parent-selected";
import { IconGallery } from '../icon';

// Base schema with common required fields
export const formSchema = z.object({
  name: z.string().min(1, '名称是必填项'),
  perms: z.string().min(1, '权限标识是必填项'),
  path: z.string().min(1, '路由地址是必填项'),
  status: z.boolean(),
  isFrame: z.boolean(),
  icon: z.string().optional(),
  remark: z.string().optional(),
  parentId: z.coerce.number().min(0, '父节点ID必须是非负数').optional(),
});

export interface ButtonFormProps {
  isLoading: boolean;
  onSubmit: (val: z.infer<typeof formSchema>) => void;
}

export default function ButtonForm({ isLoading, onSubmit }: ButtonFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parentId: void 0,
      name: '',
      perms: '',
      path: '',
      status: true,
      isFrame: false,
      remark: '',
      icon: void 0,
    },
  });

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>菜单名称</FormLabel>
                <span className="text-red-500">*</span>
                <FormControl>
                  <Input placeholder="请输入权限名称" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="perms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>权限标识</FormLabel>
                <span className="text-red-500">*</span>
                <FormControl>
                  <Input placeholder="请输入权限标识" {...field} />
                </FormControl>
                <FormDescription>例如：system:user:add</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="path"
            render={({ field }) => (
              <FormItem>
                <FormLabel>链接/路由</FormLabel>
                <span className="text-red-500">*</span>
                <FormControl>
                  <Input placeholder="请输入权限标识" {...field} />
                </FormControl>
                <FormDescription>
                  外链地址仅支持http:/https 内部地址请以/开头
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parentId"
            render={({}) => (
              <FormItem>
                <FormLabel>父节点</FormLabel>
                <FormControl>
                  <div>
                    {/* <ParentSeleted type={14} {...field} value={field.value || 0} /> */}
                  </div>
                </FormControl>
                <FormDescription>如果为最外层节点，请留空</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>图标</FormLabel>
              <FormControl>
                <IconGallery {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="isFrame"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">是否为外链</FormLabel>
                  <FormDescription>选择是否在新窗口中打开链接</FormDescription>
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
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">启用状态</FormLabel>
                  <FormDescription>
                    权限状态禁用 作用于所有已分配的角色
                  </FormDescription>
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
        </div>

        <FormField
          control={form.control}
          name="remark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>备注</FormLabel>
              <FormControl>
                <Textarea placeholder="请输入备注信息" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-right sticky bottom-0 bg-background left-0 py-4">
          <Button disabled={isLoading} className="select-none" type="submit">
            <Show when={!isLoading} fallback={<Loading />}>
              确定提交
            </Show>
          </Button>
        </div>
      </form>
    </Form>
  );
}
