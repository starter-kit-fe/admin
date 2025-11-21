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

import { createDictDataFormSchema, type DictDataFormValues } from '../../type';

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
  const t = useTranslations('DictManagement');
  const tCommon = useTranslations('Common');
  const schema = useMemo(() => createDictDataFormSchema(t), [t]);
  const form = useForm<
    DictDataFormValues,
    DictDataFormResolverContext,
    DictDataFormValues
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
      dictLabel: values.dictLabel.trim(),
      dictValue: values.dictValue.trim(),
      dictSort: values.dictSort.trim(),
      status: values.status,
      isDefault: values.isDefault,
      remark: values.remark.trim(),
    });
  });

  const title = mode === 'create' ? t('dataEditor.createTitle') : t('dataEditor.editTitle');
  const description = t('dataEditor.description');
  const submitText = submitting ? t('dataEditor.actions.saving') : t('dataEditor.actions.save');
  const cancelText = tCommon('dialogs.cancel');
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
                name="dictLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      {t('dataEditor.fields.dictLabel.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('dataEditor.fields.dictLabel.placeholder')}
                        {...field}
                      />
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
                      {t('dataEditor.fields.dictValue.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('dataEditor.fields.dictValue.placeholder')}
                        {...field}
                      />
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
                      {t('dataEditor.fields.dictSort.label')}
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
                      {t('dataEditor.fields.status.label')}
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
                          <FormLabel className="font-normal">
                            {t('dataEditor.fields.status.options.0')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="1" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t('dataEditor.fields.status.options.1')}
                          </FormLabel>
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
                      {t('dataEditor.fields.isDefault.label')}
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
                          <FormLabel className="font-normal">
                            {t('dataEditor.fields.isDefault.options.Y')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="N" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t('dataEditor.fields.isDefault.options.N')}
                          </FormLabel>
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
                    <FormLabel>{t('dataEditor.fields.remark.label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t('dataEditor.fields.remark.placeholder')}
                        {...field}
                      />
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
