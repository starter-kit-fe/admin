'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  CONCURRENT_LABELS,
  MISFIRE_POLICY_LABELS,
  PREDEFINED_JOB_TYPES,
  STATUS_TABS,
} from '../../constants';
import {
  useJobManagementMutationCounter,
  useJobManagementRefresh,
  useJobManagementStore,
} from '../../store';
import { createJob, updateJob, type JobPayload } from '../../api';
import type { Job } from '../../type';
import { jobFormSchema, type JobFormValues } from '../../type';
import { stringifyInvokeParams } from '../../utils';
import { CronHelper } from './cron-helper';

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
  const {
    editorState,
    closeEditor,
  } = useJobManagementStore();
  const job = editorState?.job ?? null;
  const mode = editorState?.mode ?? 'create';
  const isOpen = Boolean(editorState);

  const { beginMutation, endMutation } =
    useJobManagementMutationCounter();
  const refresh = useJobManagementRefresh();

  const defaultValues = useMemo<JobFormValues>(() => {
    if (!job) {
      return DEFAULT_VALUES;
    }
    // 检测任务类型
    const detectedType = PREDEFINED_JOB_TYPES.find(
      t => t.value === job.invokeTarget && t.value !== 'custom'
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
    resolver: zodResolver(jobFormSchema),
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
    const selectedType = PREDEFINED_JOB_TYPES.find(t => t.value === jobType);
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
      toast.success('任务已创建');
      refresh();
      closeEditor();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '创建任务失败，请稍后重试';
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
      toast.success('任务已更新');
      refresh();
      closeEditor();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '更新任务失败，请稍后重试';
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

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <ResponsiveDialog.Content className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>
            {mode === 'create' ? '新增任务' : '编辑任务'}
          </ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            配置定时任务的执行规则和参数。选择任务类型后会自动填充默认参数。
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* 基础信息 */}
              <div className="sm:col-span-2 flex items-center gap-2 pb-2 border-b">
                <span className="font-semibold text-lg">基础信息</span>
              </div>

              <FormField
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>任务类型</FormLabel>
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
                              {PREDEFINED_JOB_TYPES.find((t) => t.value === field.value)?.label}
                            </span>
                          ) : (
                            <SelectValue placeholder="选择任务类型" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PREDEFINED_JOB_TYPES.map((type) => (
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
                    <FormLabel>任务名称</FormLabel>
                    <FormControl>
                      <Input placeholder="例如: 数据库备份任务" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch('jobType') === 'custom' && (
                <FormField
                  control={form.control}
                  name="invokeTarget"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>调用目标</FormLabel>
                      <FormControl>
                        <Input placeholder="例如 jobService.handleReport" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {/* 调度配置 */}
              <div className="sm:col-span-2 flex items-center gap-2 pt-4 pb-2 border-b">
                <span className="font-semibold text-lg">调度配置</span>
              </div>

              <FormField
                control={form.control}
                name="cronExpression"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Cron 规则</FormLabel>
                    <FormControl>
                      <CronHelper
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.cronExpression?.message}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {/* 执行策略 */}
              <div className="sm:col-span-2 flex items-center gap-2 pt-4 pb-2 border-b">
                <span className="font-semibold text-lg">执行策略</span>
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>初始状态</FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="flex gap-6"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {STATUS_TABS.filter((tab) => tab.value !== 'all').map(
                          (tab) => (
                            <FormItem
                              key={tab.value}
                              className="flex items-center gap-2 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={tab.value} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {tab.label}
                              </FormLabel>
                            </FormItem>
                          ),
                        )}
                      </RadioGroup>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      正常状态的任务会按照 Cron 表达式自动执行,暂停状态的任务不会自动执行
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
                    <FormLabel className="text-base">错过策略</FormLabel>
                    <p className="text-xs text-muted-foreground mb-3">
                      当任务错过执行时间时的处理策略
                    </p>
                    <FormControl>
                      <RadioGroup
                        className="flex flex-col gap-3"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {Object.entries(MISFIRE_POLICY_LABELS).map(
                          ([value, label]) => (
                            <FormItem
                              key={value}
                              className="flex items-center gap-2 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={value} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {label}
                              </FormLabel>
                            </FormItem>
                          ),
                        )}
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
                    <FormLabel className="text-base">并发执行</FormLabel>
                    <p className="text-xs text-muted-foreground mb-3">
                      是否允许同一任务的多个实例同时执行
                    </p>
                    <FormControl>
                      <RadioGroup
                        className="flex flex-col gap-3"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {Object.entries(CONCURRENT_LABELS).map(
                          ([value, label]) => (
                            <FormItem
                              key={value}
                              className="flex items-center gap-2 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={value} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {label}
                              </FormLabel>
                            </FormItem>
                          ),
                        )}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* 参数配置 */}
              <div className="sm:col-span-2 flex items-center gap-2 pt-4 pb-2 border-b">
                <span className="font-semibold text-lg">参数配置</span>
              </div>

              <FormField
                control={form.control}
                name="invokeParams"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>任务参数 (JSON 格式)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder='例如: {"retentionDays": 7, "compress": true}'
                        {...field}
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      根据任务类型配置不同的参数。选择预定义任务类型会自动填充默认参数。
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
                    <FormLabel>备注 (可选)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="任务说明或注意事项" {...field} />
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
                onClick={handleClose}
                disabled={submitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </form>
        </Form>
      </ResponsiveDialog.Content>
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
