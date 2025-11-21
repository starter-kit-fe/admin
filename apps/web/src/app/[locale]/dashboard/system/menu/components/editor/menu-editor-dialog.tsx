'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { FormDialogLayout } from '@/components/dialogs/form-dialog-layout';

import type { MenuFormValues, MenuType } from '@/app/dashboard/system/menu/type';
import { buildRouteSlug } from '@/app/dashboard/system/menu/utils';
import { MenuTypeTabs } from './menu-editor/menu-type-tabs';
import { DirectoryForm } from './forms/directory-form';
import { MenuForm } from './forms/menu-form';
import { ButtonForm } from './forms/button-form';
import type { MenuParentOption } from './menu-editor/types';
export type { MenuParentOption } from './menu-editor/types';

const createMenuFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z
    .object({
      menuName: z
        .string()
        .trim()
        .min(1, t('form.validation.name.required'))
        .max(50, t('form.validation.name.max')),
      parentId: z.string().min(1),
      orderNum: z
        .string()
        .trim()
        .refine((value) => {
          if (value === '') return true;
          const parsed = Number(value);
          return Number.isInteger(parsed) && parsed >= 0 && parsed <= 9999;
        }, t('form.validation.order.range')),
      path: z.string().trim().max(200, t('form.validation.path.max')),
      query: z.string().trim().max(255, t('form.validation.query.max')),
      isFrame: z.boolean(),
      isCache: z.boolean(),
      menuType: z.enum(['M', 'C', 'F']),
      visible: z.enum(['0', '1']),
      status: z.enum(['0', '1']),
      perms: z
        .string()
        .trim()
        .max(100, t('form.validation.perms.max')),
      icon: z
        .string()
        .trim()
        .max(100, t('form.validation.icon.max')),
      remark: z.string().trim().max(500, t('form.validation.remark.max')),
    })
    .superRefine((data, ctx) => {
      if (data.menuType === 'C' || data.menuType === 'M') {
        if (!data.path || data.path.trim().length === 0) {
          ctx.addIssue({
            path: ['path'],
            code: z.ZodIssueCode.custom,
            message: t('form.validation.path.required'),
          });
        }
      }

      if (data.menuType === 'M') {
        if (!data.orderNum || data.orderNum.trim().length === 0) {
          ctx.addIssue({
            path: ['orderNum'],
            code: z.ZodIssueCode.custom,
            message: t('form.validation.order.required'),
          });
        }
        if (!data.icon || data.icon.trim().length === 0 || data.icon.trim() === '#') {
          ctx.addIssue({
            path: ['icon'],
            code: z.ZodIssueCode.custom,
            message: t('form.validation.icon.required'),
          });
        }
      }

      if (data.menuType === 'F') {
        if (!data.perms || data.perms.trim().length === 0) {
          ctx.addIssue({
            path: ['perms'],
            code: z.ZodIssueCode.custom,
            message: t('form.validation.perms.required'),
          });
        }
      }
    });

const DEFAULT_VALUES: MenuFormValues = {
  menuName: '',
  parentId: '0',
  orderNum: '',
  path: '',
  query: '',
  isFrame: false,
  isCache: false,
  menuType: 'C',
  visible: '0',
  status: '0',
  perms: '',
  icon: '',
  remark: '',
};

interface MenuEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  defaultValues?: MenuFormValues;
  parentOptions: MenuParentOption[];
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MenuFormValues) => void;
}

export function MenuEditorDialog({
  mode,
  open,
  defaultValues,
  parentOptions,
  submitting,
  onOpenChange,
  onSubmit,
}: MenuEditorDialogProps) {
  const t = useTranslations('MenuManagement');
  const tCommon = useTranslations('Common');
  const formSchema = useMemo(() => createMenuFormSchema(t), [t]);
  const form = useForm<MenuFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });
  const formId = 'menu-editor-form';

  useEffect(() => {
    form.register('menuType');
  }, [form]);

  const menuType = (form.watch('menuType') as MenuType) ?? 'C';
  const parentId = form.watch('parentId');

  const allowedMenuTypes = useMemo(() => {
    if (parentId === '0') {
      return ['C', 'M'] as MenuType[];
    }
    const currentParent = parentOptions.find((option) => option.value === parentId);
    if (!currentParent) {
      return ['C', 'M'] as MenuType[];
    }
    if (currentParent.menuType === 'M') {
      return ['C', 'M'] as MenuType[];
    }
    if (currentParent.menuType === 'C') {
      return ['F'] as MenuType[];
    }
    return ['C', 'M'] as MenuType[];
  }, [parentId, parentOptions]);

  useEffect(() => {
    if (allowedMenuTypes.length === 0) {
      return;
    }
    if (!allowedMenuTypes.includes(menuType)) {
      form.setValue('menuType', allowedMenuTypes[0]);
    }
  }, [allowedMenuTypes, form, menuType]);

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? DEFAULT_VALUES);
    }
  }, [defaultValues, form, open]);

  const formTitleLabel =
    menuType === 'M'
      ? t('types.directory')
      : menuType === 'F'
        ? t('types.button')
        : t('types.menu');
  const dialogTitle =
    mode === 'create'
      ? t(`form.createTitle.${menuType}`)
      : t(`form.editTitle.${menuType}`);
  const dialogDescription =
    mode === 'create'
      ? t(`form.createDescription.${menuType}`)
      : t(`form.editDescription.${menuType}`);

  const handleSubmit = form.handleSubmit((values) => {
    const payload: MenuFormValues = {
      ...values,
      menuName: values.menuName.trim(),
      path: values.path.trim(),
      query: values.query?.trim() ?? '',
      perms: values.perms?.trim() ?? '',
      icon: values.icon.trim(),
      remark: values.remark?.trim() ?? '',
    };

    if (payload.menuType === 'M') {
      const generatedSlug = buildRouteSlug(payload.path, payload.menuName, 'directory');
      if (!payload.path) {
        payload.path = generatedSlug;
      }
      payload.query = '';
      payload.perms = '';
      payload.isFrame = false;
      payload.isCache = false;
    }

    if (payload.menuType === 'F') {
      payload.path = '';
      payload.query = '';
      payload.isFrame = false;
      payload.isCache = false;
      payload.visible = '0';
      payload.icon = '#';
    }

    onSubmit(payload);
  });

  const submitText = submitting
    ? t('form.submit.creating')
    : mode === 'create'
      ? t('form.submit.create')
      : t('form.submit.save');

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <FormDialogLayout
        title={dialogTitle}
        description={dialogDescription}
        contentClassName="sm:max-w-2xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1 sm:flex-none sm:min-w-[96px]"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              form={formId}
              disabled={submitting}
              className="flex-[1.5] sm:flex-none sm:min-w-[96px]"
            >
              {submitText}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form
            id={formId}
            className="flex flex-col gap-8 pb-4"
            onSubmit={handleSubmit}
          >
            <MenuTypeTabs
              value={menuType}
              allowedTypes={allowedMenuTypes}
              onChange={(next) => form.setValue('menuType', next)}
            />
            {menuType === 'M' ? (
              <DirectoryForm form={form} parentOptions={parentOptions} />
            ) : null}
            {menuType === 'C' ? (
              <MenuForm form={form} parentOptions={parentOptions} />
            ) : null}
            {menuType === 'F' ? (
              <ButtonForm form={form} parentOptions={parentOptions} />
            ) : null}
          </form>
        </Form>
      </FormDialogLayout>
    </ResponsiveDialog>
  );
}
