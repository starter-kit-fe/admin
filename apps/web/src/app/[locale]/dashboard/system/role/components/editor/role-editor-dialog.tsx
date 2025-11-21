import type { MenuTreeNode } from '@/app/dashboard/system/menu/type';
import { FormDialogLayout } from '@/components/dialogs/form-dialog-layout';
import { InlineLoading } from '@/components/loading';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTranslations } from 'next-intl';

import type { RoleFormValues } from '../../type';
import { MenuPermissionTree } from './menu-permission-tree';

const createRoleFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    roleName: z
      .string()
      .trim()
      .min(1, t('form.validation.name.required'))
      .max(50, t('form.validation.name.max')),
    roleKey: z
      .string()
      .trim()
      .min(1, t('form.validation.key.required'))
      .max(100, t('form.validation.key.max')),
    roleSort: z
      .string()
      .trim()
      .refine((value) => {
        if (value === '') return true;
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed >= 0 && parsed <= 9999;
      }, t('form.validation.sort.range')),
    dataScope: z.enum(['1', '2', '3', '4', '5']),
    menuCheckStrictly: z.boolean(),
    deptCheckStrictly: z.boolean(),
    status: z.enum(['0', '1']),
    remark: z.string().trim().max(256, t('form.validation.remark.max')),
    menuIds: z.array(z.number().int().nonnegative()),
  });

const DEFAULT_VALUES: RoleFormValues = {
  roleName: '',
  roleKey: '',
  roleSort: '',
  dataScope: '1',
  menuCheckStrictly: true,
  deptCheckStrictly: false,
  status: '0',
  remark: '',
  menuIds: [],
};

interface RoleEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  defaultValues?: RoleFormValues;
  submitting?: boolean;
  loading?: boolean;
  menuTree?: MenuTreeNode[];
  menuTreeLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RoleFormValues) => void;
}

export function RoleEditorDialog({
  mode,
  open,
  defaultValues,
  submitting,
  loading,
  menuTree,
  menuTreeLoading,
  onOpenChange,
  onSubmit,
}: RoleEditorDialogProps) {
  const t = useTranslations('RoleManagement');
  const formSchema = useMemo(() => createRoleFormSchema(t), [t]);

  const form = useForm<RoleFormValues, Record<string, never>, RoleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? DEFAULT_VALUES);
    }
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      ...values,
      roleName: values.roleName.trim(),
      roleKey: values.roleKey.trim(),
      remark: values.remark.trim(),
    });
  });

  const title = mode === 'create' ? t('form.createTitle') : t('form.editTitle');
  const description =
    mode === 'create'
      ? t('form.createDescription')
      : t('form.editDescription');
  const submitText = submitting
    ? t('form.submit.creating')
    : mode === 'create'
      ? t('form.submit.create')
      : t('form.submit.save');

  const disabled = submitting || loading;
  const formId = 'role-editor-form';

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <FormDialogLayout
        title={title}
        description={description}
        contentClassName="sm:max-w-2xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={disabled}
              className="flex-1 sm:flex-none sm:min-w-[96px]"
            >
              {t('dialogs.bulkDeleteCancel')}
            </Button>
            <Button
              type="submit"
              form={formId}
              disabled={disabled}
              className="flex-[1.5] sm:flex-none sm:min-w-[96px]"
            >
              {submitText}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form
            id={formId}
            className="flex flex-col gap-5 pb-4"
            onSubmit={handleSubmit}
          >
            {loading ? (
              <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/40">
                <InlineLoading label={t('form.loading')} />
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="roleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="mr-1 text-destructive">*</span>
                      {t('form.fields.name')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('form.fields.namePlaceholder')}
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="mr-1 text-destructive">*</span>
                      {t('form.fields.key')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('form.fields.keyPlaceholder')}
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleSort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.sort')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('form.fields.sortPlaceholder')}
                        disabled={disabled}
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
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
                    <FormLabel>{t('form.fields.status')}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="flex gap-4"
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={disabled}
                      >
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="0" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t('status.enabled')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="1" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {t('status.disabled')}
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
                  <FormLabel>{t('form.fields.remark')}</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[96px] resize-none"
                      placeholder={t('form.fields.remarkPlaceholder')}
                      disabled={disabled}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="menuIds"
              render={({ field }) => (
                <FormItem>
                  <MenuPermissionTree
                    nodes={menuTree ?? []}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={disabled || menuTreeLoading}
                  />
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
