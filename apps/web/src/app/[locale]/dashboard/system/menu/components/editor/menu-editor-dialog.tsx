'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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

const TYPE_LABELS: Record<MenuType, string> = {
  M: '目录',
  C: '菜单',
  F: '按钮',
};

const CREATE_DESCRIPTIONS: Record<MenuType, string> = {
  M: '创建新的目录，用于组织子菜单。',
  C: '创建新的菜单，并配置路由与权限。',
  F: '创建新的按钮权限，用于控制页面操作。',
};

const UPDATE_DESCRIPTIONS: Record<MenuType, string> = {
  M: '更新目录信息，调整层级或显示状态。',
  C: '更新菜单的路由、图标及权限配置。',
  F: '更新按钮权限，控制页面内操作。',
};

const menuFormSchema = z
  .object({
    menuName: z
      .string()
      .trim()
      .min(1, '请输入菜单名称')
      .max(50, '菜单名称不能超过 50 个字符'),
    parentId: z.string().min(1),
    orderNum: z
      .string()
      .trim()
      .refine((value) => {
        if (value === '') return true;
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed >= 0 && parsed <= 9999;
      }, '显示顺序需为 0 到 9999 的整数'),
    path: z.string().trim().max(200, '路由地址不超过 200 个字符'),
    query: z
      .string()
      .trim()
      .max(255, '路由参数不超过 255 个字符'),
    isFrame: z.boolean(),
    isCache: z.boolean(),
    menuType: z.enum(['M', 'C', 'F']),
    visible: z.enum(['0', '1']),
    status: z.enum(['0', '1']),
    perms: z
      .string()
      .trim()
      .max(100, '权限标识不超过 100 个字符'),
    icon: z
      .string()
      .trim()
      .max(100, '图标标识不超过 100 个字符'),
    remark: z
      .string()
      .trim()
      .max(500, '备注最长 500 个字符'),
  })
  .superRefine((data, ctx) => {
    if (data.menuType === 'C' || data.menuType === 'M') {
      if (!data.path || data.path.trim().length === 0) {
        ctx.addIssue({
          path: ['path'],
          code: z.ZodIssueCode.custom,
          message: '请输入路由地址',
        });
      }
    }

    if (data.menuType === 'M') {
      if (!data.orderNum || data.orderNum.trim().length === 0) {
        ctx.addIssue({
          path: ['orderNum'],
          code: z.ZodIssueCode.custom,
          message: '请输入目录排序',
        });
      }
      if (!data.icon || data.icon.trim().length === 0 || data.icon.trim() === '#') {
        ctx.addIssue({
          path: ['icon'],
          code: z.ZodIssueCode.custom,
          message: '请填写目录图标',
        });
      }
    }

    if (data.menuType === 'F') {
      if (!data.perms || data.perms.trim().length === 0) {
        ctx.addIssue({
          path: ['perms'],
          code: z.ZodIssueCode.custom,
          message: '请输入权限标识',
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
  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
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

  const formTitleLabel = TYPE_LABELS[menuType] ?? '菜单';
  const dialogTitle =
    mode === 'create' ? `新增${formTitleLabel}` : `编辑${formTitleLabel}`;
  const dialogDescription =
    mode === 'create'
      ? CREATE_DESCRIPTIONS[menuType] ?? CREATE_DESCRIPTIONS.C
      : UPDATE_DESCRIPTIONS[menuType] ?? UPDATE_DESCRIPTIONS.C;

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

  const submitText = submitting ? '提交中...' : mode === 'create' ? '创建' : '保存';

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
              取消
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
