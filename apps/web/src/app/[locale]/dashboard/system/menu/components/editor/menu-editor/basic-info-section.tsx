import { useEffect } from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useWatch, type UseFormReturn } from 'react-hook-form';

import type { MenuFormValues } from '@/app/dashboard/system/menu/type';
import type { MenuParentOption } from './types';
import { SectionHeader } from './section-header';
import { MenuParentTreeSelect } from './menu-parent-tree-select';

interface BasicInfoSectionProps {
  form: UseFormReturn<MenuFormValues>;
  parentOptions: MenuParentOption[];
}

export function BasicInfoSection({
  form,
  parentOptions,
}: BasicInfoSectionProps) {
  const { control } = form;
  const menuType = useWatch({
    control,
    name: 'menuType',
  });
  const currentMenuType = (menuType ?? 'C') as MenuFormValues['menuType'];
  const parentId = useWatch({ control, name: 'parentId' });
  useEffect(() => {
    if (currentMenuType === 'M' && (!parentId || parentId === '')) {
      form.setValue('parentId', '0', { shouldDirty: false, shouldValidate: false });
    }
  }, [currentMenuType, form, parentId]);
  const isDirectory = currentMenuType === 'M';
  const nameLabel =
    currentMenuType === 'M'
      ? '目录名称'
      : currentMenuType === 'F'
        ? '按钮名称'
        : '菜单名称';
  const parentLabel = currentMenuType === 'M' ? '父级目录' : '父级菜单';
  const orderLabel = currentMenuType === 'M' ? '目录排序' : '显示顺序';

  return (
    <div className="space-y-4">
      <SectionHeader
        title="基础信息"
        description={
          currentMenuType === 'M'
            ? '设置目录的层级与排序，只需维护名称与父级关系。'
            : '设置菜单或按钮的层级、名称与基础类型。'
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="menuName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="mr-1 text-destructive">*</span>
                {nameLabel}
              </FormLabel>
              <FormControl>
                <Input placeholder={`请输入${nameLabel}`} {...field} />
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
              <FormLabel>{parentLabel}</FormLabel>
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
              <FormLabel>
                {isDirectory ? <span className="mr-1 text-destructive">*</span> : null}
                {orderLabel}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="请输入排序（0-9999）"
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
