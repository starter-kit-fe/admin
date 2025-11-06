import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { Textarea } from '@/components/ui/textarea';

import type { ConfigFormValues } from '../type';

const configFormSchema = z.object({
  configName: z
    .string()
    .trim()
    .min(1, '请输入参数名称')
    .max(100, '参数名称不能超过 100 个字符'),
  configKey: z
    .string()
    .trim()
    .min(1, '请输入参数键名')
    .max(100, '参数键名不能超过 100 个字符'),
  configValue: z
    .string()
    .trim()
    .min(1, '请输入参数键值')
    .max(500, '参数键值过长'),
  configType: z.enum(['Y', 'N']),
  remark: z
    .string()
    .trim()
    .max(255, '备注不能超过 255 个字符')
    .optional()
    .or(z.literal('')),
});

const DEFAULT_VALUES: ConfigFormValues = {
  configName: '',
  configKey: '',
  configValue: '',
  configType: 'N',
  remark: '',
};

function Required() {
  return <span className="mr-1 text-destructive">*</span>;
}

interface ConfigEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  defaultValues?: ConfigFormValues;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ConfigFormValues) => void;
}

export function ConfigEditorDialog({
  mode,
  open,
  defaultValues,
  submitting,
  onOpenChange,
  onSubmit,
}: ConfigEditorDialogProps) {
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? DEFAULT_VALUES);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      configName: values.configName.trim(),
      configKey: values.configKey.trim(),
      configValue: values.configValue.trim(),
      configType: values.configType,
      remark: values.remark?.trim() ?? '',
    });
  });

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-xl">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>
            {mode === 'create' ? '新增参数' : '编辑参数'}
          </ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            配置系统运行时参数，参数键名需保持唯一。
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="configName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Required />
                      参数名称
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="请输入参数名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="configKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Required />
                      参数键名
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="例如 sys.account.registerUser" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="configValue"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      <Required />
                      参数键值
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="请输入参数键值" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="configType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Required />
                      参数类型
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="flex gap-4"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Y" />
                          </FormControl>
                          <FormLabel className="font-normal">系统内置</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="N" />
                          </FormControl>
                          <FormLabel className="font-normal">自定义</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="可填写参数用途说明" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
