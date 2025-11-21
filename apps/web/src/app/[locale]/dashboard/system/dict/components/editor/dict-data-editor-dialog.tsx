'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { FormDialogLayout } from '@/components/dialogs/form-dialog-layout';
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

import { dictDataFormSchema, type DictDataFormValues } from '../../type';

const DEFAULT_VALUES: DictDataFormValues = {
  dictLabel: '',
  dictValue: '',
  dictSort: '0',
  status: '0',
  isDefault: 'N',
  remark: '',
};

function RequiredMark() {
  return <span className="mr-1 text-destructive">*</span>;
}

type DictDataFormResolverContext = Record<string, never>;

interface DictDataEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  defaultValues?: DictDataFormValues;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DictDataFormValues) => void;
}

export function DictDataEditorDialog({
  mode,
  open,
  defaultValues,
  submitting,

  onOpenChange,
  onSubmit,
}: DictDataEditorDialogProps) {
  const form = useForm<
    DictDataFormValues,
    DictDataFormResolverContext,
    DictDataFormValues
  >({
    resolver: zodResolver(dictDataFormSchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? DEFAULT_VALUES);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      dictLabel: values.dictLabel.trim(),
      dictValue: values.dictValue.trim(),
      dictSort: values.dictSort.trim(),
      status: values.status,
      isDefault: values.isDefault,
      remark: values.remark.trim(),
    });
  });

  const title = mode === 'create' ? '新增字典数据' : '编辑字典数据';
  const description = '维护当前字典类型的取值列表，标签与键值需要保持唯一。';
  const submitText = submitting ? '保存中...' : '保存';
  const formId = 'dict-data-editor-form';

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <FormDialogLayout
        title={title}
        description={description}
        contentClassName="sm:max-w-xl"
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
          <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-6 pb-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dictLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      字典标签
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="请输入字典标签" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dictValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      字典键值
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="请输入字典键值" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dictSort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      显示排序
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="0"
                        value={field.value}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === '') {
                            field.onChange('');
                            return;
                          }
                          field.onChange(raw.replace(/[^\d]/g, ''));
                        }}
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
                    <FormLabel>
                      <RequiredMark />
                      状态
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="flex gap-4"
                        value={field.value}
                        onValueChange={field.onChange}
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
                name="isDefault"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      是否默认
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
                          <FormLabel className="font-normal">默认</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="N" />
                          </FormControl>
                          <FormLabel className="font-normal">否</FormLabel>
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
                      <Textarea rows={3} placeholder="可填写数值说明" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </FormDialogLayout>
    </ResponsiveDialog>
  );
}
