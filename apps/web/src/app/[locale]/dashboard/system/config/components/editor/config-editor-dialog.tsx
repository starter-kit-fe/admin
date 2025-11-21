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

import { createConfigFormSchema, type ConfigFormValues } from '../../type';

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

type ConfigFormResolverContext = Record<string, never>;

export function ConfigEditorDialog({
  mode,
  open,
  defaultValues,
  submitting,
  onOpenChange,
  onSubmit,
}: ConfigEditorDialogProps) {
  const t = useTranslations('ConfigManagement');
  const tCommon = useTranslations('Common');
  const schema = useMemo(() => createConfigFormSchema(t), [t]);
  const form = useForm<ConfigFormValues, ConfigFormResolverContext, ConfigFormValues>({
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
      configName: values.configName.trim(),
      configKey: values.configKey.trim(),
      configValue: values.configValue.trim(),
      configType: values.configType,
      remark: values.remark?.trim() ?? '',
    });
  });

  const title = mode === 'create' ? t('form.title.create') : t('form.title.edit');
  const description = t('form.description');
  const formId = 'config-editor-form';
  const cancelLabel = tCommon('dialogs.cancel');
  const submitLabel = submitting
    ? t('form.submit.creating')
    : mode === 'create'
      ? t('form.submit.create')
      : t('form.submit.save');

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
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              form={formId}
              disabled={submitting}
              className="flex-[1.5] sm:flex-none sm:min-w-[96px]"
            >
              {submitLabel}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form id={formId} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="configName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Required />
                      {t('form.fields.name')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('form.fields.namePlaceholder')}
                        {...field}
                      />
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
                      {t('form.fields.key')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('form.fields.keyPlaceholder')}
                        {...field}
                      />
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
                      {t('form.fields.value')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t('form.fields.valuePlaceholder')}
                        {...field}
                      />
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
                      {t('form.fields.type')}
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
                            {t('form.fields.typeSystem')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="N" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t('form.fields.typeCustom')}
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
                    <FormLabel>{t('form.fields.remark')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t('form.fields.remarkPlaceholder')}
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
