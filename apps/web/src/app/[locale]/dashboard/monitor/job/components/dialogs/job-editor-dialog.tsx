'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { FormDialogLayout } from '@/components/dialogs/form-dialog-layout';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  PREDEFINED_JOB_TYPES,
  STATUS_TAB_KEYS,
} from '../../constants';
import {
  useJobManagementMutationCounter,
  useJobManagementRefresh,
  useJobManagementStore,
} from '../../store';
import { createJob, updateJob, type JobPayload } from '../../api';
import type { Job } from '../../type';
import { createJobFormSchema, type JobFormValues } from '../../type';
import { stringifyInvokeParams } from '../../utils';
import { CronInputWithGenerator } from './cron-input-with-generator';

const DEFAULT_VALUES: JobFormValues = {
  jobType: 'custom',
  jobName: '',
  jobGroup: 'DEFAULT',
  invokeTarget: '',
  cronExpression: '',
  misfirePolicy: '3',
  concurrent: '1',
  status: '0',
  remark: '',
  invokeParams: '',
};

export function JobEditorDialog() {
  const t = useTranslations('JobManagement');
  const tCommon = useTranslations('Common');
  const { editorState, closeEditor } = useJobManagementStore();
  const job = editorState?.job ?? null;
  const mode = editorState?.mode ?? 'create';
  const isOpen = Boolean(editorState);

  const { beginMutation, endMutation } = useJobManagementMutationCounter();
  const refresh = useJobManagementRefresh();

  const defaultValues = useMemo<JobFormValues>(() => {
    if (!job) {
      return DEFAULT_VALUES;
    }
    const detectedType = PREDEFINED_JOB_TYPES.find(
      (t) => t.value === job.invokeTarget && t.value !== 'custom',
    );
    return {
      jobType: detectedType?.value ?? 'custom',
      jobName: job.jobName ?? '',
      jobGroup: job.jobGroup ?? 'DEFAULT',
      invokeTarget: job.invokeTarget ?? '',
      cronExpression: job.cronExpression ?? '',
      misfirePolicy: (job.misfirePolicy ?? '3') as '1' | '2' | '3',
      concurrent: (job.concurrent ?? '1') as '0' | '1',
      status: (job.status ?? '0') as '0' | '1',
      remark: job.remark ?? '',
      invokeParams: stringifyInvokeParams(job.invokeParams),
    };
  }, [job]);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(createJobFormSchema(t)),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, isOpen]);

  const handleClose = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }
    closeEditor();
  };

  const handleJobTypeChange = (jobType: string) => {
    const selectedType = PREDEFINED_JOB_TYPES.find((t) => t.value === jobType);
    if (selectedType) {
      if (jobType !== 'custom') {
        form.setValue('invokeTarget', selectedType.value);
      } else {
        form.setValue('invokeTarget', '');
      }
      form.setValue('jobGroup', selectedType.defaultGroup);
      form.setValue('cronExpression', selectedType.defaultCron);
      form.setValue('invokeParams', JSON.stringify(selectedType.defaultParams, null, 2));
    }
  };

  const createMutation = useMutation({
    mutationFn: createJob,
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('editor.toast.createSuccess'));
      refresh();
      closeEditor();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t('editor.toast.createError');
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      jobId,
      payload,
    }: {
      jobId: number;
      payload: JobPayload;
    }) => updateJob(jobId, payload),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(t('editor.toast.updateSuccess'));
      refresh();
      closeEditor();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : t('editor.toast.updateError');
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
    },
  });

  const submitting =
    createMutation.isPending || updateMutation.isPending;

  const handleSubmit = form.handleSubmit((values) => {
    const payload = buildPayload(values);
    if (mode === 'create') {
      createMutation.mutate(payload);
    } else if (job) {
      updateMutation.mutate({ jobId: job.jobId, payload });
    }
  });

  const title =
    mode === 'create' ? t('editor.title.create') : t('editor.title.edit');
  const description = t('editor.description');
  const statusTabs = STATUS_TAB_KEYS.filter((value) => value !== 'all').map(
    (value) => ({
      value,
      label: t(`filters.statusTabs.${value}`),
    }),
  );
  const jobTypeOptions = useMemo(
    () =>
      PREDEFINED_JOB_TYPES.map((type) => ({
        ...type,
        label: t(`editor.jobTypes.${type.value}.label`),
        description: t(`editor.jobTypes.${type.value}.description`),
      })),
    [t],
  );
  const misfirePolicyLabels = useMemo(
    () =>
      ['1', '2', '3'].map((value) => ({
        value,
        label: t(`table.misfirePolicies.${value}`),
      })),
    [t],
  );
  const concurrentLabels = useMemo(
    () =>
      ['0', '1'].map((value) => ({
        value,
        label: t(`table.concurrent.${value}`),
      })),
    [t],
  );
  const submitLabel = submitting
    ? t('editor.actions.saving')
    : mode === 'create'
      ? t('editor.actions.create')
      : t('editor.actions.save');

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <FormDialogLayout
        title={title}
        description={description}
        contentClassName="sm:max-w-4xl h-[90vh]"
        bodyClassName="px-6 py-4"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 sm:flex-none sm:min-w-[96px]"
            >
              {tCommon('dialogs.cancel')}
            </Button>
            <Button
              type="submit"
              form="job-editor-form"
              disabled={submitting}
              className="flex-[1.5] sm:flex-none sm:min-w-[96px]"
            >
              {submitLabel}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={handleSubmit} id="job-editor-form" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex items-center gap-2 pb-2 border-b">
                <span className="font-semibold text-lg">
                  {t('editor.sections.basic')}
                </span>
              </div>

              <FormField
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('editor.fields.jobType.label')}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleJobTypeChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {field.value ? (
                            <span className="font-medium">
                              {
                                jobTypeOptions.find((t) => t.value === field.value)
                                  ?.label
                              }
                            </span>
                          ) : (
                            <SelectValue
                              placeholder={t('editor.fields.jobType.placeholder')}
                            />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobTypeOptions.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="font-medium">{type.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {type.description}
                              </span>
                            </div>
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
                name="jobName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('editor.fields.jobName.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('editor.fields.jobName.placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('editor.fields.jobGroup.label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('editor.fields.jobGroup.placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('jobType') === 'custom' ? (
                <FormField
                  control={form.control}
                  name="invokeTarget"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t('editor.fields.invokeTarget.label')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t(
                            'editor.fields.invokeTarget.placeholder',
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <div className="sm:col-span-2 flex items-center gap-2 pt-4 pb-2 border-b">
                <span className="font-semibold text-lg">
                  {t('editor.sections.schedule')}
                </span>
              </div>

              <FormField
                control={form.control}
                name="cronExpression"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('editor.fields.cronExpression.label')}</FormLabel>
                    <FormControl>
                      <CronInputWithGenerator
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.cronExpression?.message}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="sm:col-span-2 flex items-center gap-2 pt-4 pb-2 border-b">
                <span className="font-semibold text-lg">
                  {t('editor.sections.execution')}
                </span>
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('editor.fields.status.label')}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="flex gap-6"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {statusTabs.map((tab) => (
                          <FormItem
                            key={tab.value}
                            className="flex items-center gap-2 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={tab.value} />
                            </FormControl>
                            <FormLabel className="font-normal">{tab.label}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {t('editor.fields.status.helper')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="misfirePolicy"
                render={({ field }) => (
                  <FormItem className="rounded-lg border p-4">
                    <FormLabel className="text-base">
                      {t('editor.fields.misfirePolicy.label')}
                    </FormLabel>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {t('editor.fields.misfirePolicy.helper')}
                    </p>
                    <FormControl>
                      <RadioGroup
                        className="flex flex-col gap-3"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {misfirePolicyLabels.map(({ value, label }) => (
                          <FormItem
                            key={value}
                            className="flex items-center gap-2 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={value} />
                            </FormControl>
                            <FormLabel className="font-normal">{label}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="concurrent"
                render={({ field }) => (
                  <FormItem className="rounded-lg border p-4">
                    <FormLabel className="text-base">
                      {t('editor.fields.concurrent.label')}
                    </FormLabel>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {t('editor.fields.concurrent.helper')}
                    </p>
                    <FormControl>
                      <RadioGroup
                        className="flex flex-col gap-3"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {concurrentLabels.map(({ value, label }) => (
                          <FormItem
                            key={value}
                            className="flex items-center gap-2 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem value={value} />
                            </FormControl>
                            <FormLabel className="font-normal">{label}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="sm:col-span-2 flex items-center gap-2 pt-4 pb-2 border-b">
                <span className="font-semibold text-lg">
                  {t('editor.sections.params')}
                </span>
              </div>
              <FormField
                control={form.control}
                name="invokeParams"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('editor.fields.invokeParams.label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder={t('editor.fields.invokeParams.placeholder')}
                        {...field}
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {t('editor.fields.invokeParams.helper')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t('editor.fields.remark.label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder={t('editor.fields.remark.placeholder')}
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

function buildPayload(values: JobFormValues): JobPayload {
  const trimmedParams = values.invokeParams?.trim() ?? '';
  return {
    jobName: values.jobName.trim(),
    jobGroup: values.jobGroup.trim() || 'DEFAULT',
    invokeTarget: values.invokeTarget.trim(),
    cronExpression: values.cronExpression.trim(),
    misfirePolicy: values.misfirePolicy,
    concurrent: values.concurrent,
    status: values.status,
    remark: values.remark?.trim() ?? '',
    invokeParams: trimmedParams || undefined,
  };
}
