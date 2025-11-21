import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import {
  FormControl,
  FormDescription,
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
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';

import { MenuIconSelect } from '../menu-icon-select';
import { SectionHeader } from './section-header';

export function DirectorySection({
  form,
}: {
  form: UseFormReturn<MenuFormValues>;
}) {
  const { control } = form;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="目录配置"
        description="维护目录的路由地址、图标及状态信息。"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="mr-1 text-destructive">*</span>
                路由地址
              </FormLabel>
              <FormControl>
                <Input placeholder="例如 system 或 monitor" {...field} />
              </FormControl>
              <FormDescription>填写目录的访问路径，例如 system 或 monitor。</FormDescription>
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
              <FormLabel>
                <span className="mr-1 text-destructive">*</span>
                目录图标
              </FormLabel>
              <FormControl>
                <MenuIconSelect
                  value={field.value}
                  onChange={field.onChange}
                  allowEmpty={false}
                  placeholder="选择目录图标"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>状态</FormLabel>
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
      <FormField
        control={control}
        name="remark"
        render={({ field }) => (
          <FormItem>
            <FormLabel>备注</FormLabel>
            <FormControl>
              <Textarea
                className="min-h-[96px] resize-none"
                placeholder="请输入备注（可选）"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
