import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { InlineLoading } from '@/components/loading';

import type { RoleFormValues } from '../type';
import type { MenuTreeNode } from '../../menu/type';
import { MenuPermissionTree } from './menu-permission-tree';

const roleFormSchema: z.ZodType<RoleFormValues> = z.object({
  roleName: z.string().trim().min(1, '请输入角色名称').max(50, '角色名称不能超过 50 个字符'),
  roleKey: z.string().trim().min(1, '请输入权限字符').max(100, '权限字符不能超过 100 个字符'),
  roleSort: z
    .string()
    .trim()
    .refine(
      (value) => {
        if (value === '') return true;
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed >= 0 && parsed <= 9999;
      },
      '排序需为 0 到 9999 之间的整数',
    ),
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
    resolver: zodResolver<RoleFormValues, Record<string, never>, RoleFormValues>(roleFormSchema),
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
  const submitText = submitting ? '提交中...' : mode === 'create' ? '创建' : '保存';

  const disabled = submitting || loading;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-xl">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>{title}</ResponsiveDialog.Title>
          <ResponsiveDialog.Description>{description}</ResponsiveDialog.Description>
        </ResponsiveDialog.Header>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <InlineLoading label="正在加载角色信息..." />
          </div>
        ) : null}

        <Form {...form}>
          <form className="space-y-5" onSubmit={handleSubmit}>
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
                      <Input placeholder="请输入角色名称" disabled={disabled} {...field} />
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
                      <Input placeholder="请输入权限字符" disabled={disabled} {...field} />
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
                        onChange={(event) => field.onChange(event.target.value)}
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
                          <FormLabel className="font-normal">正常</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="1" />
                          </FormControl>
                          <FormLabel className="font-normal">停用</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataScope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>数据权限</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择数据范围" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">全部数据权限</SelectItem>
                        <SelectItem value="2">自定义数据权限</SelectItem>
                        <SelectItem value="3">本部门数据权限</SelectItem>
                        <SelectItem value="4">本部门及以下数据权限</SelectItem>
                        <SelectItem value="5">仅本人数据权限</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4 rounded-lg border border-dashed border-border/60 p-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">菜单树联动</p>
                    <p className="text-xs text-muted-foreground">开启后分配菜单时父子节点数据将一起变更。</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="menuCheckStrictly"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-y-0">
                        <FormControl>
                          <Switch disabled={disabled} checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">部门树联动</p>
                    <p className="text-xs text-muted-foreground">开启后分配部门权限时父子节点保持关联。</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="deptCheckStrictly"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-y-0">
                        <FormControl>
                          <Switch disabled={disabled} checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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

            <ResponsiveDialog.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
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
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
