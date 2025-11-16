'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';

import type { MenuFormValues, MenuType } from '@/app/dashboard/system/menu/type';
import { buildRouteSlug } from '@/app/dashboard/system/menu/utils';
import { MenuTypeTabs } from './menu-editor/menu-type-tabs';
import { DirectoryForm } from './forms/directory-form';
import { MenuForm } from './forms/menu-form';
import { ButtonForm } from './forms/button-form';
import type { MenuParentOption } from './menu-editor/types';
export type { MenuParentOption } from './menu-editor/types';
import { useTranslations } from 'next-intl';

type TranslationFn = ReturnType<typeof useTranslations>;

const buildMenuFormSchema = (t: TranslationFn) =>
  z
    .object({
      menuName: z
        .string()
        .trim()
        .min(1, t('validation.name.required'))
        .max(50, t('validation.name.max')),
      parentId: z.string().min(1),
      orderNum: z
        .string()
        .trim()
        .refine((value) => {
          if (value === '') return true;
          const parsed = Number(value);
          return Number.isInteger(parsed) && parsed >= 0 && parsed <= 9999;
        }, t('validation.order.range')),
      path: z.string().trim().max(200, t('validation.path.max')),
      query: z.string().trim().max(255, t('validation.query.max')),
      isFrame: z.boolean(),
      isCache: z.boolean(),
      menuType: z.enum(['M', 'C', 'F']),
      visible: z.enum(['0', '1']),
      status: z.enum(['0', '1']),
      perms: z.string().trim().max(100, t('validation.perms.max')),
      icon: z.string().trim().max(100, t('validation.icon.max')),
      remark: z.string().trim().max(500, t('validation.remark.max')),
    })
    .superRefine((data, ctx) => {
      if (data.menuType === 'C' || data.menuType === 'M') {
        if (!data.path || data.path.trim().length === 0) {
          ctx.addIssue({
            path: ['path'],
            code: z.ZodIssueCode.custom,
            message: t('validation.path.required'),
          });
        }
      }

      if (data.menuType === 'M') {
        if (!data.orderNum || data.orderNum.trim().length === 0) {
          ctx.addIssue({
            path: ['orderNum'],
            code: z.ZodIssueCode.custom,
            message: t('validation.order.required'),
          });
        }
        if (!data.icon || data.icon.trim().length === 0 || data.icon.trim() === '#') {
          ctx.addIssue({
            path: ['icon'],
            code: z.ZodIssueCode.custom,
            message: t('validation.icon.required'),
          });
        }
      }

      if (data.menuType === 'F') {
        if (!data.perms || data.perms.trim().length === 0) {
          ctx.addIssue({
            path: ['perms'],
            code: z.ZodIssueCode.custom,
            message: t('validation.perms.required'),
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
  const tForm = useTranslations('MenuManagement.form');
  const tCommon = useTranslations('Common.dialogs');
  const formSchema = useMemo(() => buildMenuFormSchema(tForm), [tForm]);
  const form = useForm<MenuFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

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

  const dialogTitle =
    mode === 'create'
      ? tForm(`createTitle.${menuType}`)
      : tForm(`editTitle.${menuType}`);
  const dialogDescription =
    mode === 'create'
      ? tForm(`createDescription.${menuType}`)
      : tForm(`editDescription.${menuType}`);

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
    ? tForm('submit.creating')
    : mode === 'create'
      ? tForm('submit.create')
      : tForm('submit.save');

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-full max-h-[90vh] flex-col min-h-0">
          <ResponsiveDialog.Header className="flex-shrink-0 border-b border-border/60 px-6 py-5">
            <ResponsiveDialog.Title>{dialogTitle}</ResponsiveDialog.Title>
            <ResponsiveDialog.Description>{dialogDescription}</ResponsiveDialog.Description>
          </ResponsiveDialog.Header>

          <Form {...form}>
            <form className="flex h-full flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-8 pb-4">
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
                </div>
              </div>

              <ResponsiveDialog.Footer className="flex-shrink-0 gap-2 border-t border-border/60 bg-background px-6 py-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitText}
                </Button>
              </ResponsiveDialog.Footer>
            </form>
          </Form>
        </div>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
