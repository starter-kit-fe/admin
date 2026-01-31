import { z } from 'zod';

export interface Job {
  id: number;
  jobName: string;
  jobGroup: string;
  invokeTarget: string;
  invokeParams?: unknown;
  cronExpression: string;
  misfirePolicy: string;
  concurrent: string;
  status: string;
  remark?: string | null;
  createBy?: string;
  createdAt?: string;
  updateBy?: string;
  updatedAt?: string;
  isRunning: boolean;
  currentLogId?: number | null;
}

export interface JobListResponse {
  list: Job[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export interface JobLog {
  id: number;
  jobId: number;
  jobName: string;
  jobGroup: string;
  invokeTarget: string;
  invokeParams?: unknown;
  jobMessage?: string | null;
  status: string;
  exception?: string | null;
  createdAt?: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  steps?: JobLogStep[];
}

export interface JobLogStep {
  stepId: number;
  jobLogId: number;
  stepName: string;
  stepOrder: number;
  status: '0' | '1' | '2'; // 0=成功, 1=失败, 2=进行中
  message?: string;
  output?: string;
  error?: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  createdAt: string;
}

export interface JobLogWithSteps extends JobLog {
  steps?: JobLogStep[];
}

export interface StepEvent {
  type: 'step_start' | 'step_log' | 'step_end' | 'complete' | 'heartbeat';
  id: number;
  stepId?: number;
  stepOrder: number;
  stepName?: string;
  status?: '0' | '1' | '2';
  message?: string;
  output?: string;
  error?: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface JobLogList {
  list: JobLog[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export interface JobDetailResponse {
  job: Job;
  invokeParamsText: string;
  logs: JobLogList;
}

export interface JobDetailParams {
  logPageNum?: number;
  logPageSize?: number;
}

const baseJsonSchema = z.string().default('');

export const jobFormSchema = z.object({
  jobType: z.string(),
  jobName: z.string(),
  jobGroup: z.string(),
  invokeTarget: z.string(),
  cronExpression: z.string(),
  misfirePolicy: z.enum(['1', '2', '3']),
  concurrent: z.enum(['0', '1']),
  status: z.enum(['0', '1']),
  remark: z.string().optional(),
  invokeParams: baseJsonSchema.optional(),
});

export const createJobFormSchema = (t: (key: string) => string) =>
  jobFormSchema.extend({
    jobType: jobFormSchema.shape.jobType.min(1, t('editor.validation.jobType')),
    jobName: jobFormSchema.shape.jobName
      .trim()
      .min(1, t('editor.validation.jobName')),
    jobGroup: jobFormSchema.shape.jobGroup
      .trim()
      .min(1, t('editor.validation.jobGroup')),
    invokeTarget: jobFormSchema.shape.invokeTarget
      .trim()
      .min(1, t('editor.validation.invokeTarget')),
    cronExpression: jobFormSchema.shape.cronExpression
      .trim()
      .min(1, t('editor.validation.cronExpression')),
    invokeParams: jobFormSchema.shape.invokeParams.superRefine((value, ctx) => {
      const trimmed = value?.trim() ?? '';
      if (!trimmed) {
        return;
      }
      try {
        JSON.parse(trimmed);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('editor.validation.invalidJson'),
        });
      }
    }),
  });

export type JobFormValues = z.infer<ReturnType<typeof createJobFormSchema>>;
