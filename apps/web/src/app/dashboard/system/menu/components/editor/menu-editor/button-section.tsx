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

export function ButtonSection({ form }: { form: UseFormReturn<MenuFormValues> }) {
  const { control } = form;

  return (
    <div className="space-y-4">
      <SectionHeader title="按钮权限" description="按钮用于权限控制，不在侧边导航中展示。" />
      <FormField
        control={control}
        name="perms"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="mr-1 text-destructive">*</span>
              权限标识
            </FormLabel>
            <FormControl>
              <Input placeholder="例如 system:user:list" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid gap-4 md:grid-cols-2">
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
