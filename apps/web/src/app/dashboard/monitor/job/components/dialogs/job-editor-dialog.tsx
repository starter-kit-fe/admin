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
  CONCURRENT_LABELS,
  MISFIRE_POLICY_LABELS,
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

const DEFAULT_VALUES: JobFormValues = {
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
    return {
      jobName: job.jobName ?? '',
      jobGroup: job.jobGroup ?? 'DEFAULT',
      invokeTarget: job.invokeTarget ?? '',
      cronExpression: job.cronExpression ?? '',
      misfirePolicy: job.misfirePolicy ?? '3',
      concurrent: job.concurrent ?? '1',
      status: job.status ?? '0',
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
      <ResponsiveDialog.Content className="sm:max-w-2xl">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>
            {mode === 'create' ? '新增任务' : '编辑任务'}
          </ResponsiveDialog.Title>
          <ResponsiveDialog.Description>
            配置调度规则与调用目标，支持 JSON 参数传递。
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="jobName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>任务名称</FormLabel>
                    <FormControl>
                      <Input placeholder="例如 数据同步任务" {...field} />
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
                    <FormLabel>任务分组</FormLabel>
                    <FormControl>
                      <Input placeholder="默认为 DEFAULT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="cronExpression"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Cron 表达式</FormLabel>
                    <FormControl>
                      <Input placeholder="例如 0 */5 * * * ?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="misfirePolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>调度策略</FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="flex flex-wrap gap-3"
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
                  <FormItem>
                    <FormLabel>并发策略</FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="flex flex-wrap gap-3"
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
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>任务状态</FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="flex gap-4"
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invokeParams"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>调用参数（JSON）</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder='例如 {"foo":"bar"}'
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
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="可填写调度说明" {...field} />
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
