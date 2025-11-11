import type { MenuTreeNode } from '@/app/dashboard/system/menu/type';
import { InlineLoading } from '@/components/loading';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { RoleFormValues } from '../../type';
import { MenuPermissionTree } from './menu-permission-tree';

const roleFormSchema = z.object({
  roleName: z
    .string()
    .trim()
    .min(1, '请输入角色名称')
    .max(50, '角色名称不能超过 50 个字符'),
  roleKey: z
    .string()
    .trim()
    .min(1, '请输入权限字符')
    .max(100, '权限字符不能超过 100 个字符'),
  roleSort: z
    .string()
    .trim()
    .refine((value) => {
      if (value === '') return true;
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed >= 0 && parsed <= 9999;
    }, '排序需为 0 到 9999 之间的整数'),
  dataScope: z.enum(['1', '2', '3', '4', '5']),
  menuCheckStrictly: z.boolean(),
  deptCheckStrictly: z.boolean(),
  status: z.enum(['0', '1']),
  remark: z.string().trim().max(256, '备注最长 256 个字符'),
  menuIds: z.array(z.number().int().nonnegative()),
});

const DEFAULT_VALUES: RoleFormValues = {
  roleName: '',
  roleKey: '',
  roleSort: '',
  dataScope: '1',
  menuCheckStrictly: true,
  deptCheckStrictly: false,
  status: '0',
  remark: '',
  menuIds: [],
};

interface RoleEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  defaultValues?: RoleFormValues;
  submitting?: boolean;
  loading?: boolean;
  menuTree?: MenuTreeNode[];
  menuTreeLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RoleFormValues) => void;
}

export function RoleEditorDialog({
  mode,
  open,
  defaultValues,
  submitting,
  loading,
  menuTree,
  menuTreeLoading,
  onOpenChange,
  onSubmit,
}: RoleEditorDialogProps) {
  const form = useForm<RoleFormValues, Record<string, never>, RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? DEFAULT_VALUES);
    }
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      ...values,
      roleName: values.roleName.trim(),
      roleKey: values.roleKey.trim(),
      remark: values.remark.trim(),
    });
  });

  const title = mode === 'create' ? '新增角色' : '编辑角色';
  const description =
    mode === 'create'
      ? '创建一个新的系统角色并配置基础权限。'
      : '更新角色的基本信息和权限范围。';
  const submitText = submitting
    ? '提交中...'
    : mode === 'create'
      ? '创建'
      : '保存';

  const disabled = submitting || loading;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-full max-h-[90vh] flex-col min-h-0">
          <ResponsiveDialog.Header className="flex-shrink-0 border-b border-border/60 px-6 py-5">
            <ResponsiveDialog.Title>{title}</ResponsiveDialog.Title>
            <ResponsiveDialog.Description>
              {description}
            </ResponsiveDialog.Description>
          </ResponsiveDialog.Header>

          <Form {...form}>
            <form
              className="flex h-full flex-1 flex-col min-h-0"
              onSubmit={handleSubmit}
            >
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-5 pb-4">
                  {loading ? (
                    <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/40">
                      <InlineLoading label="正在加载角色信息..." />
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="roleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="mr-1 text-destructive">*</span>
                            角色名称
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="请输入角色名称"
                              disabled={disabled}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="roleKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <span className="mr-1 text-destructive">*</span>
                            权限字符
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="请输入权限字符"
                              disabled={disabled}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="roleSort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>显示顺序</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="默认 0"
                              disabled={disabled}
                              value={field.value}
                              onChange={(event) =>
                                field.onChange(event.target.value)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>角色状态</FormLabel>
                          <FormControl>
                            <RadioGroup
                              className="flex gap-4"
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={disabled}
                            >
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="0" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  正常
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="1" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  停用
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
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
                            disabled={disabled}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="menuIds"
                    render={({ field }) => (
                      <FormItem>
                        <MenuPermissionTree
                          nodes={menuTree ?? []}
                          value={field.value}
                          onChange={field.onChange}
                          disabled={disabled || menuTreeLoading}
                        />
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
                  disabled={disabled}
                >
                  取消
                </Button>
                <Button type="submit" disabled={disabled}>
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
