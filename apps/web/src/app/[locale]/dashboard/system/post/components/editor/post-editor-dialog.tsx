'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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

import type { PostFormValues } from '../../type';

const createPostFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    postCode: z
      .string()
      .trim()
      .min(1, t('editor.validation.postCode.required'))
      .max(50, t('editor.validation.postCode.max')),
    postName: z
      .string()
      .trim()
      .min(1, t('editor.validation.postName.required'))
      .max(50, t('editor.validation.postName.max')),
    status: z.enum(['0', '1']),
    remark: z.string().trim().max(255, t('editor.validation.remark.max')),
  });

const DEFAULT_VALUES: PostFormValues = {
  postCode: '',
  postName: '',
  status: '0',
  remark: '',
};

function RequiredMark() {
  return <span className="mr-1 text-destructive">*</span>;
}

interface PostEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  defaultValues?: PostFormValues;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PostFormValues) => void;
}

export function PostEditorDialog({
  mode,
  open,
  defaultValues,
  submitting,
  onOpenChange,
  onSubmit,
}: PostEditorDialogProps) {
  const t = useTranslations('PostManagement');
  const tCommon = useTranslations('Common');
  const formSchema = useMemo(() => createPostFormSchema(t), [t]);
  const form = useForm<PostFormValues>({
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
      postCode: values.postCode.trim(),
      postName: values.postName.trim(),
      status: values.status,
      remark: values.remark.trim(),
    });
  });

  const title = mode === 'create' ? t('editor.createTitle') : t('editor.editTitle');
  const description = t('editor.description');
  const submitText = submitting ? t('editor.actions.saving') : t('editor.actions.save');
  const formId = 'post-editor-form';

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
              {tCommon('cancel')}
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
                name="postCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      {t('editor.fields.postCode.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('editor.fields.postCode.placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      {t('editor.fields.postName.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('editor.fields.postName.placeholder')}
                        {...field}
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
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      <RequiredMark />
                      {t('editor.fields.status.label')}
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
                            {t('editor.fields.status.options.0')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="1" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t('editor.fields.status.options.1')}
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
                  <FormLabel>{t('editor.fields.remark.label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('editor.fields.remark.placeholder')}
                      className="min-h-[72px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </FormDialogLayout>
    </ResponsiveDialog>
  );
}
