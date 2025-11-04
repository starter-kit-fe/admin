import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useWatch, type UseFormReturn } from 'react-hook-form';

import type { MenuFormValues } from '../../type';
import type { MenuParentOption } from './types';
import { SectionHeader } from './section-header';
import { MenuParentTreeSelect } from './menu-parent-tree-select';

interface BasicInfoSectionProps {
  form: UseFormReturn<MenuFormValues>;
  parentOptions: MenuParentOption[];
}

export function BasicInfoSection({ form, parentOptions }: BasicInfoSectionProps) {
  const { control } = form;
  const menuType = useWatch({
    control,
    name: 'menuType',
  });
  const currentMenuType = (menuType ?? 'C') as MenuFormValues['menuType'];

  return (
    <div className="space-y-4">
      <SectionHeader title="基础信息" description="设置菜单的层级、名称与基础类型。" />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="menuName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="mr-1 text-destructive">*</span>
                菜单名称
              </FormLabel>
              <FormControl>
                <Input placeholder="请输入菜单名称" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>父级菜单</FormLabel>
              <FormControl>
                <MenuParentTreeSelect
                  options={parentOptions}
                  value={field.value}
                  menuType={currentMenuType}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="orderNum"
          render={({ field }) => (
            <FormItem>
              <FormLabel>显示顺序</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="默认 0"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
