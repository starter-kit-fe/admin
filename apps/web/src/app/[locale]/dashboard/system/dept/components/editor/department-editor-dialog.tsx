'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import {
  type DepartmentFormValues,
  type DepartmentParentOption,
  buildDepartmentFormSchema,
} from '../../type';

const DEFAULT_VALUES: DepartmentFormValues = {
  deptName: '',
  parentId: '0',
  orderNum: '0',
  leader: '',
  phone: '',
  email: '',
  status: '0',
  remark: '',
};

type DepartmentFormResolverContext = Record<string, never>;

function RequiredMark() {
  return <span className="mr-1 text-destructive">*</span>;
}

interface DepartmentEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  parentOptions: DepartmentParentOption[];
  defaultValues?: DepartmentFormValues;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DepartmentFormValues) => void;
}

export function DepartmentEditorDialog({
  mode,
  open,
  parentOptions,
  defaultValues,
  submitting,
  onOpenChange,
  onSubmit,
}: DepartmentEditorDialogProps) {
  const tEditor = useTranslations('DepartmentManagement.editor');
  const formSchema = useMemo(() => buildDepartmentFormSchema(tEditor), [tEditor]);
  const form = useForm<
    DepartmentFormValues,
    DepartmentFormResolverContext,
    DepartmentFormValues
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
      deptName: values.deptName.trim(),
      parentId: values.parentId,
      orderNum: values.orderNum.trim(),
      leader: values.leader.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      status: values.status,
      remark: values.remark?.trim() ?? '',
    });
  });

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-2xl">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>
            {mode === 'create'
              ? tEditor('createTitle')
              : tEditor('editTitle')}
          </ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            {tEditor('description')}
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      {tEditor('fields.parent.label')}
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={tEditor('fields.parent.placeholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-64">
                        {parentOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            className={cn(
                              'truncate',
                              option.disabled ? 'opacity-60' : undefined,
                            )}
                            style={{ paddingLeft: option.level * 12 }}
                          >
                            {option.path.join(' / ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deptName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      {tEditor('fields.name.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tEditor('fields.name.placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orderNum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <RequiredMark />
                      {tEditor('fields.order.label')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tEditor('fields.order.placeholder')}
                        inputMode="numeric"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leader"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tEditor('fields.leader.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tEditor('fields.leader.placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tEditor('fields.phone.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tEditor('fields.phone.placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tEditor('fields.email.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tEditor('fields.email.placeholder')}
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
                      {tEditor('fields.status.label')}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-wrap gap-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="0" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {tEditor('fields.status.options.0')}
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="1" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {tEditor('fields.status.options.1')}
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
                  <FormLabel>{tEditor('fields.remark.label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={tEditor('fields.remark.placeholder')}
                      className="min-h-[72px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ResponsiveDialog.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                {tEditor('actions.cancel')}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? tEditor('actions.saving') : tEditor('actions.save')}
              </Button>
            </ResponsiveDialog.Footer>
          </form>
        </Form>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
