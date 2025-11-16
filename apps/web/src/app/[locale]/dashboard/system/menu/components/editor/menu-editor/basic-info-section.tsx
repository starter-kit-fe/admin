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
import { useTranslations } from 'next-intl';

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
  const tSections = useTranslations('MenuManagement.form.sections');
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
  const nameKey =
    currentMenuType === 'M'
      ? 'directory'
      : currentMenuType === 'F'
        ? 'button'
        : 'menu';
  const nameLabel = tSections(`basic.fields.name.${nameKey}` as const);
  const parentKey = currentMenuType === 'M' ? 'directory' : 'menu';
  const parentLabel = tSections(`basic.fields.parent.${parentKey}` as const);
  const orderKey = currentMenuType === 'M' ? 'directory' : 'default';
  const orderLabel = tSections(`basic.fields.order.${orderKey}` as const);
  const namePlaceholder = tSections('basic.fields.name.placeholder', {
    target: nameLabel,
  });
  const orderPlaceholder = tSections('basic.fields.order.placeholder');
  const sectionDescription = tSections(
    `basic.description.${currentMenuType === 'M' ? 'directory' : 'default'}` as const,
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title={tSections('basic.title')}
        description={sectionDescription}
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
                <Input placeholder={namePlaceholder} {...field} />
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
                  placeholder={orderPlaceholder}
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
