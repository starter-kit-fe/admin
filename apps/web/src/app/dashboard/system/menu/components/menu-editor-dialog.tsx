import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { MenuFormValues, MenuType } from '../type';
import { BasicInfoSection } from './menu-editor/basic-info-section';
import { DirectorySection } from './menu-editor/directory-section';
import { PageSection } from './menu-editor/page-section';
import { ButtonSection } from './menu-editor/button-section';
import { RemarkSection } from './menu-editor/remark-section';
import type { MenuParentOption } from './menu-editor/types';
import { MENU_TYPE_OPTIONS } from './menu-editor/constants';
export type { MenuParentOption } from './menu-editor/types';

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
    component: z
      .string()
      .trim()
      .max(255, '组件路径不超过 255 个字符')
      .optional()
      .or(z.literal('')),
    query: z
      .string()
      .trim()
      .max(255, '路由参数不超过 255 个字符')
      .optional()
      .or(z.literal('')),
    routeName: z
      .string()
      .trim()
      .max(50, '路由名称不能超过 50 个字符')
      .optional()
      .or(z.literal('')),
    isFrame: z.boolean(),
    isCache: z.boolean(),
    menuType: z.enum(['M', 'C', 'F']),
    visible: z.enum(['0', '1']),
    status: z.enum(['0', '1']),
    perms: z
      .string()
      .trim()
      .max(100, '权限标识不超过 100 个字符')
      .optional()
      .or(z.literal('')),
    icon: z
      .string()
      .trim()
      .max(100, '图标标识不超过 100 个字符')
      .default('#'),
    remark: z
      .string()
      .trim()
      .max(500, '备注最长 500 个字符')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.menuType !== 'F') {
      if (!data.path || data.path.trim().length === 0) {
        ctx.addIssue({
          path: ['path'],
          code: z.ZodIssueCode.custom,
          message: '请输入路由地址',
        });
      }
      if (!data.routeName || data.routeName.trim().length === 0) {
        ctx.addIssue({
          path: ['routeName'],
          code: z.ZodIssueCode.custom,
          message: '请输入路由名称',
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
  component: '',
  query: '',
  routeName: '',
  isFrame: false,
  isCache: false,
  menuType: 'C',
  visible: '0',
  status: '0',
  perms: '',
  icon: '#',
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

  const menuType = form.watch('menuType');

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? DEFAULT_VALUES);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = form.handleSubmit((values) => {
    const payload: MenuFormValues = {
      ...values,
      menuName: values.menuName.trim(),
      path: values.path.trim(),
      routeName: values.routeName?.trim() ?? '',
      component: values.component?.trim() ?? '',
      query: values.query?.trim() ?? '',
      perms: values.perms?.trim() ?? '',
      icon: values.icon.trim() || '#',
      remark: values.remark?.trim() ?? '',
    };

    if (payload.menuType === 'F') {
      payload.path = '';
      payload.routeName = '';
      payload.component = '';
      payload.query = '';
      payload.isFrame = false;
      payload.isCache = false;
      payload.visible = '0';
      payload.icon = '#';
    }

    onSubmit(payload);
  });

  const title = mode === 'create' ? '新增菜单' : '编辑菜单';
  const description =
    mode === 'create'
      ? '为系统添加新的菜单项，支持目录、菜单及按钮类型。'
      : '更新菜单的基础信息、显示状态与权限标识。';
  const submitText = submitting ? '提交中...' : mode === 'create' ? '创建' : '保存';

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-full max-h-[90vh] flex-col min-h-0">
          <ResponsiveDialog.Header className="flex-shrink-0 border-b border-border/60 px-6 py-5">
            <ResponsiveDialog.Title>{title}</ResponsiveDialog.Title>
            <ResponsiveDialog.Description>{description}</ResponsiveDialog.Description>
          </ResponsiveDialog.Header>

          <Form {...form}>
            <form className="flex h-full flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-8 pb-4">
                  <BasicInfoSection form={form} parentOptions={parentOptions} />
                  <Tabs
                    value={menuType}
                    onValueChange={(value) => form.setValue('menuType', value as MenuType)}
                  >
                    <TabsList className="flex flex-wrap gap-2 rounded-lg border border-border/60 bg-muted/40 p-1">
                      {MENU_TYPE_OPTIONS.map((option) => (
                        <TabsTrigger
                          key={option.value}
                          value={option.value}
                          className="flex-1 rounded-md px-3 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow"
                        >
                          <div className="flex flex-col items-start text-left">
                            <span className="font-medium text-foreground">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <div className="mt-4 space-y-6">
                      <TabsContent value="M" className="mt-0">
                        <DirectorySection form={form} />
                      </TabsContent>
                      <TabsContent value="C" className="mt-0">
                        <PageSection form={form} />
                      </TabsContent>
                      <TabsContent value="F" className="mt-0">
                        <ButtonSection form={form} />
                      </TabsContent>
                    </div>
                  </Tabs>
                  <RemarkSection form={form} />
                </div>
              </div>

              <ResponsiveDialog.Footer className="flex-shrink-0 gap-2 border-t border-border/60 bg-background px-6 py-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  取消
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
