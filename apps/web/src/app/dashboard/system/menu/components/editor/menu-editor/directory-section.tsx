import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UseFormReturn } from 'react-hook-form';

import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import { SectionHeader } from './section-header';

export function DirectorySection({ form }: { form: UseFormReturn<MenuFormValues> }) {
  const { control } = form;

  return (
    <div className="space-y-4">
      <SectionHeader title="目录配置" description="配置目录的路由地址与展示信息。" />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>路由地址</FormLabel>
              <FormControl>
                <Input placeholder="例如 system" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="routeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>路由名称</FormLabel>
              <FormControl>
                <Input placeholder="用于 keepalive 等场景" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>菜单图标</FormLabel>
              <FormControl>
                <Input placeholder="可选，例如 layout" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="visible"
          render={({ field }) => (
            <FormItem>
              <FormLabel>显示状态</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择显示状态" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">显示</SelectItem>
                  <SelectItem value="1">隐藏</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>菜单状态</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择状态" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="0">正常</SelectItem>
                  <SelectItem value="1">停用</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
