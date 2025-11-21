'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';

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

import { createDictTypeFormSchema, type DictTypeFormValues } from '../../type';

const DEFAULT_VALUES: DictTypeFormValues = {
  dictName: '',
  dictType: '',
  status: '0',
  remark: '',
};

function RequiredMark() {
  return <span className="mr-1 text-destructive">*</span>;
}

type DictTypeFormResolverContext = Record<string, never>;

interface DictTypeEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  defaultValues?: DictTypeFormValues;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DictTypeFormValues) => void;
}

export function DictTypeEditorDialog({
  mode,
  open,
  defaultValues,
  submitting,
  onOpenChange,
  onSubmit,
}: DictTypeEditorDialogProps) {
  const t = useTranslations('DictManagement');
  const tCommon = useTranslations('Common');
  const schema = useMemo(() => createDictTypeFormSchema(t), [t]);
  const form = useForm<
    DictTypeFormValues,
    DictTypeFormResolverContext,
    DictTypeFormValues
  >({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? DEFAULT_VALUES);
    }
  }, [defaultValues, form, open]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      dictName: values.dictName.trim(),
      dictType: values.dictType.trim(),
      status: values.status,
      remark: values.remark.trim(),
    });
  });

  const title = mode === 'create' ? t('typeEditor.createTitle') : t('typeEditor.editTitle');
  const description = t('typeEditor.description');
  const submitText = submitting ? t('typeEditor.actions.saving') : t('typeEditor.actions.save');
  const cancelText = tCommon('dialogs.cancel');
  const formId = 'dict-type-editor-form';

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
              {cancelText}
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
                name="dictName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      字典名称
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="请输入字典名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dictType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      字典类型
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="请输入字典类型" {...field} />
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
                name="remark"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="可填写字典用途说明" {...field} />
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
