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
  jobLogId: number;
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
  jobLogId: number;
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

const jsonTextSchema = z
  .string()
  .default('')
  .refine(
    (value) => {
      const trimmed = value?.trim() ?? '';
      if (!trimmed) {
        return true;
      }
      try {
        JSON.parse(trimmed);
        return true;
      } catch {
        return false;
      }
    },
    { message: '请输入有效的 JSON 字符串' },
  );

export const jobFormSchema = z.object({
  jobType: z.string().min(1, '请选择任务类型'),
  jobName: z.string().trim().min(1, '请输入任务名称'),
  jobGroup: z.string().trim().min(1, '请输入任务分组'),
  invokeTarget: z.string().trim().min(1, '请输入调用目标'),
  cronExpression: z.string().trim().min(1, '请输入 Cron 表达式'),
  misfirePolicy: z.enum(['1', '2', '3']),
  concurrent: z.enum(['0', '1']),
  status: z.enum(['0', '1']),
  remark: z.string().optional(),
  invokeParams: jsonTextSchema.optional(),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;
