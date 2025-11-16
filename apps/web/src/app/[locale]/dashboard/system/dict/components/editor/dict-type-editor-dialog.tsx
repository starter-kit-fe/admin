'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';

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

import {
  buildDictTypeFormSchema,
  type DictTypeFormValues,
} from '../../type';

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
  const t = useTranslations('DictManagement.typeEditor');
  const formSchema = useMemo(() => buildDictTypeFormSchema(t), [t]);

  const form = useForm<
    DictTypeFormValues,
    DictTypeFormResolverContext,
    DictTypeFormValues
  >({
    resolver: zodResolver(formSchema),
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

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-xl">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>
            {mode === 'create' ? t('createTitle') : t('editTitle')}
          </ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            {t('description')}
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dictName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      {t('fields.dictName.label')}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t('fields.dictName.placeholder')} {...field} />
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
                      {t('fields.dictType.label')}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={t('fields.dictType.placeholder')} {...field} />
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
                      {t('fields.status.label')}
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
                            {t('fields.status.options.0')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="1" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t('fields.status.options.1')}
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
                    <FormLabel>{t('fields.remark.label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t('fields.remark.placeholder')}
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
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? t('actions.saving') : t('actions.save')}
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
