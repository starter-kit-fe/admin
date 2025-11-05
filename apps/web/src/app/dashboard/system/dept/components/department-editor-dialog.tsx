import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import type { DepartmentFormValues, DepartmentParentOption } from '../type';

const departmentFormSchema = z.object({
  deptName: z
    .string()
    .trim()
    .min(1, '请输入部门名称')
    .max(50, '部门名称不能超过 50 个字符'),
  parentId: z.string().trim().min(1, '请选择上级部门'),
  orderNum: z
    .string()
    .trim()
    .refine((value) => {
      if (value === '') return true;
      if (!/^\d+$/.test(value)) return false;
      const parsed = Number(value);
      return parsed >= 0 && parsed <= 9999;
    }, '显示排序需为 0 到 9999 的整数'),
  leader: z
    .string()
    .trim()
    .max(50, '负责人不能超过 50 个字符')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        /^1\d{10}$/.test(value) ||
        /^0\d{2,3}-?\d{7,8}$/.test(value) ||
        /^\+?[0-9\-]{6,18}$/.test(value),
      '请输入有效联系电话',
    )
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      '请输入正确邮箱',
    )
    .optional()
    .or(z.literal('')),
  status: z.enum(['0', '1']),
  remark: z
    .string()
    .trim()
    .max(255, '备注不能超过 255 个字符')
    .optional()
    .or(z.literal('')),
});

const DEFAULT_VALUES: DepartmentFormValues = {
  deptName: '',
  parentId: '0',
  orderNum: '0',
  leader: '',
  phone: '',
  email: '',
  status: '0',
  remark: '',
};

function RequiredMark() {
  return <span className="mr-1 text-destructive">*</span>;
}

interface DepartmentEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  parentOptions: DepartmentParentOption[];
  defaultValues?: DepartmentFormValues;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DepartmentFormValues) => void;
}

export function DepartmentEditorDialog({
  mode,
  open,
  parentOptions,
  defaultValues,
  submitting,
  onOpenChange,
  onSubmit,
}: DepartmentEditorDialogProps) {
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? DEFAULT_VALUES);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      deptName: values.deptName.trim(),
      parentId: values.parentId,
      orderNum: values.orderNum.trim(),
      leader: values.leader?.trim() ?? '',
      phone: values.phone?.trim() ?? '',
      email: values.email?.trim() ?? '',
      status: values.status,
      remark: values.remark?.trim() ?? '',
    });
  });

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-2xl">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>
            {mode === 'create' ? '新增部门' : '编辑部门'}
          </ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            请填写部门基础信息，所有节点均可新增子部门。
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />上级部门
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择上级部门" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-64">
                        {parentOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            className={cn(
                              'truncate',
                              option.disabled ? 'opacity-60' : undefined,
                            )}
                            style={{ paddingLeft: option.level * 12 }}
                          >
                            {option.path.join(' / ')}
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
                name="deptName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />部门名称
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="输入部门名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orderNum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />显示排序
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="0" inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leader"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>负责人</FormLabel>
                    <FormControl>
                      <Input placeholder="输入负责人" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>联系电话</FormLabel>
                    <FormControl>
                      <Input placeholder="输入联系电话" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input placeholder="输入联系邮箱" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      <RequiredMark />部门状态
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-wrap gap-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="0" />
                          </FormControl>
                          <FormLabel className="font-normal">正常</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
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
            </div>
            <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="填写备注信息（可选）"
                      className="min-h-[72px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ResponsiveDialog.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '保存'}
              </Button>
            </ResponsiveDialog.Footer>
          </form>
        </Form>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
