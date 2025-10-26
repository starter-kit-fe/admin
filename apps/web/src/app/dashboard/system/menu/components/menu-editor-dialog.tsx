import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';

import type { MenuFormValues, MenuType } from '../type';

const menuFormSchema = z.object({
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
    .min(1, '请输入路由名称')
    .max(50, '路由名称不能超过 50 个字符'),
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

export interface MenuParentOption {
  label: string;
  value: string;
}

interface MenuEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  defaultValues?: MenuFormValues;
  parentOptions: MenuParentOption[];
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MenuFormValues) => void;
}

const MENU_TYPE_OPTIONS: Array<{ label: string; value: MenuType; description: string }> = [
  { label: '目录', value: 'M', description: '仅作为分组容器，不可点击跳转' },
  { label: '菜单', value: 'C', description: '常规路由菜单，对应页面组件' },
  { label: '按钮', value: 'F', description: '仅用于权限控制，不在侧边栏展示' },
];

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

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? DEFAULT_VALUES);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      ...values,
      menuName: values.menuName.trim(),
      path: values.path.trim(),
      routeName: values.routeName.trim(),
      component: values.component?.trim() ?? '',
      query: values.query?.trim() ?? '',
      perms: values.perms?.trim() ?? '',
      icon: values.icon.trim() || '#',
      remark: values.remark?.trim() ?? '',
    });
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
            <form
              className="flex h-full flex-1 flex-col min-h-0"
              onSubmit={handleSubmit}
            >
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-6 pb-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
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
                      control={form.control}
                      name="parentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>父级菜单</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="请选择父级菜单" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {parentOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
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
                    <FormField
                      control={form.control}
                      name="menuType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>菜单类型</FormLabel>
                          <FormControl>
                            <RadioGroup
                              className="grid gap-2 md:grid-cols-3"
                              value={field.value}
                              onValueChange={(value: MenuType) => field.onChange(value)}
                            >
                              {MENU_TYPE_OPTIONS.map((option) => (
                                <FormItem
                                  key={option.value}
                                  className="flex flex-col gap-1 rounded-lg border border-border/60 px-3 py-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FormControl>
                                        <RadioGroupItem value={option.value} />
                                      </FormControl>
                                      <span className="text-sm font-medium">{option.label}</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {option.description}
                                  </p>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="path"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>路由地址</FormLabel>
                          <FormControl>
                            <Input placeholder="例如 system/user" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="routeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>路由名称</FormLabel>
                          <FormControl>
                            <Input placeholder="用于 keepalive 等场景" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="component"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>组件路径</FormLabel>
                          <FormControl>
                            <Input placeholder="可选，例如 system/user/index" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="query"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>路由参数</FormLabel>
                          <FormControl>
                            <Input placeholder="可选，例如 role=admin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="perms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>权限标识</FormLabel>
                          <FormControl>
                            <Input placeholder="可选，例如 system:user:list" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>菜单图标</FormLabel>
                          <FormControl>
                            <Input placeholder="可选，例如 user" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="isFrame"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                          <div>
                            <FormLabel className="font-medium">外链跳转</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              开启后点击菜单将直接访问外部链接。
                            </p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isCache"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                          <div>
                            <FormLabel className="font-medium">禁用缓存</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              开启后不使用 keepalive。关闭则保持页面状态。
                            </p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="visible"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>显示状态</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="请选择显示状态" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">显示</SelectItem>
                              <SelectItem value="1">隐藏</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
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

                  <FormField
                    control={form.control}
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
