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
  const t = useTranslations('MenuManagement');
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
      ? t('form.sections.basic.fields.name.directory')
      : currentMenuType === 'F'
        ? t('form.sections.basic.fields.name.button')
        : t('form.sections.basic.fields.name.menu');
  const parentLabel =
    currentMenuType === 'M'
      ? t('form.sections.basic.fields.parent.directory')
      : t('form.sections.basic.fields.parent.menu');
  const orderLabel =
    currentMenuType === 'M'
      ? t('form.sections.basic.fields.order.directory')
      : t('form.sections.basic.fields.order.default');

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('form.sections.basic.title')}
        description={
          currentMenuType === 'M'
            ? t('form.sections.basic.description.directory')
            : t('form.sections.basic.description.default')
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
                <Input
                  placeholder={t('form.sections.basic.fields.name.placeholder', {
                    target: nameLabel,
                  })}
                  {...field}
                />
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
                  placeholder={t('form.sections.basic.fields.order.placeholder')}
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
