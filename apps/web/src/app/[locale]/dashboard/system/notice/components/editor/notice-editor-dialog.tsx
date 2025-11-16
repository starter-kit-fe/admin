'use client';

import { useEffect, useMemo } from 'react';
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
import { useTranslations } from 'next-intl';

import type { NoticeFormValues } from '../../type';

const DEFAULT_VALUES: NoticeFormValues = {
  noticeTitle: '',
  noticeType: '1',
  noticeContent: '',
  status: '0',
  remark: '',
};

function Required() {
  return <span className="mr-1 text-destructive">*</span>;
}

interface NoticeEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  defaultValues?: NoticeFormValues;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NoticeFormValues) => void;
}

export function NoticeEditorDialog({
  mode,
  open,
  defaultValues,
  submitting,
  onOpenChange,
  onSubmit,
}: NoticeEditorDialogProps) {
  const tForm = useTranslations('NoticeManagement.form');
  const tDialogs = useTranslations('Common.dialogs');

  const schema = useMemo(
    () =>
      z.object({
        noticeTitle: z
          .string()
          .trim()
          .min(1, tForm('validation.title.required'))
          .max(50, tForm('validation.title.max')),
        noticeType: z.enum(['1', '2']),
        noticeContent: z
          .string()
          .trim()
          .min(1, tForm('validation.content.required')),
        status: z.enum(['0', '1']),
        remark: z
          .string()
          .trim()
          .max(255, tForm('validation.remark.max')),
      }),
    [tForm],
  );

  const form = useForm<NoticeFormValues>({
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
      noticeTitle: values.noticeTitle.trim(),
      noticeType: values.noticeType,
      noticeContent: values.noticeContent.trim(),
      status: values.status,
      remark: values.remark.trim(),
    });
  });

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-2xl">
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
                name="noticeTitle"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      <Required />
                      {tForm('fields.title')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tForm('fields.titlePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="noticeType"
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
                            <RadioGroupItem value="1" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {tForm('fields.typeNotification')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="2" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {tForm('fields.typeAnnouncement')}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Required />
                      {tForm('fields.status')}
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
                            {tForm('fields.statusActive')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="1" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {tForm('fields.statusDisabled')}
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
                name="noticeContent"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>
                      <Required />
                      {tForm('fields.content')}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder={tForm('fields.contentPlaceholder')}
                        {...field}
                      />
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
