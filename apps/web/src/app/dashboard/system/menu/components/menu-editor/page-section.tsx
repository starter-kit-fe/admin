import { Switch } from '@/components/ui/switch';
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

import type { MenuFormValues } from '../../type';
import { SectionHeader } from './section-header';

export function PageSection({ form }: { form: UseFormReturn<MenuFormValues> }) {
  const { control } = form;

  return (
    <div className="space-y-4">
      <SectionHeader title="菜单配置" description="配置菜单路由、组件映射及权限信息。" />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>路由地址</FormLabel>
              <FormControl>
                <Input placeholder="例如 system/user" {...field} />
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
        <FormField
          control={control}
          name="component"
          render={({ field }) => (
            <FormItem>
              <FormLabel>组件路径</FormLabel>
              <FormControl>
                <Input placeholder="可选，例如 system/user/index" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormLabel>路由参数</FormLabel>
              <FormControl>
                <Input placeholder="可选，例如 role=admin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="isFrame"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
              <div>
                <FormLabel className="font-medium">外链跳转</FormLabel>
                <p className="text-xs text-muted-foreground">开启后点击菜单将直接访问外部链接。</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="isCache"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
              <div>
                <FormLabel className="font-medium">禁用缓存</FormLabel>
                <p className="text-xs text-muted-foreground">关闭后使用 keepalive，保留页面状态。</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
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
                <Input placeholder="可选，例如 user" {...field} />
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
        <FormField
          control={control}
          name="perms"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>权限标识</FormLabel>
              <FormControl>
                <Input placeholder="用于按钮或页面权限控制，例如 system:user:list" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
