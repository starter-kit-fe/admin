'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
import { z } from 'zod';
import { useTranslations } from 'next-intl';

import type { ConfigFormValues } from '../../type';

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
  const tForm = useTranslations('ConfigManagement.form');
  const tDialogs = useTranslations('Common.dialogs');

  const schema = useMemo(
    () =>
      z.object({
        configName: z
          .string()
          .trim()
          .min(1, tForm('validation.name.required'))
          .max(100, tForm('validation.name.max')),
        configKey: z
          .string()
          .trim()
          .min(1, tForm('validation.key.required'))
          .max(100, tForm('validation.key.max')),
        configValue: z
          .string()
          .trim()
          .min(1, tForm('validation.value.required'))
          .max(500, tForm('validation.value.max')),
        configType: z.enum(['Y', 'N']),
        remark: z
          .string()
          .trim()
          .max(255, tForm('validation.remark.max')),
      }),
    [tForm],
  );

  const form = useForm<ConfigFormValues>({
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

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-xl">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>
            {mode === 'create' ? tForm('title.create') : tForm('title.edit')}
          </ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            {tForm('description')}
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
                      {tForm('fields.name')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tForm('fields.namePlaceholder')}
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
                      {tForm('fields.key')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tForm('fields.keyPlaceholder')}
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
                      {tForm('fields.value')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={tForm('fields.valuePlaceholder')}
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
                      {tForm('fields.type')}
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
                            {tForm('fields.typeSystem')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="N" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {tForm('fields.typeCustom')}
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
                    <FormLabel>{tForm('fields.remark')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={tForm('fields.remarkPlaceholder')}
                        {...field}
                      />
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
                {tDialogs('cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? tForm('submit.creating')
                  : mode === 'create'
                    ? tForm('submit.create')
                    : tForm('submit.save')}
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
