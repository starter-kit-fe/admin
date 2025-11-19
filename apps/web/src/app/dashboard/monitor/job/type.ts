import { z } from 'zod';

export interface Job {
  jobId: number;
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
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

export interface JobListResponse {
  items: Job[];
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
  createTime?: string;
}

export interface JobLogList {
  items: JobLog[];
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
  .optional()
  .transform((value) => value?.trim() ?? '')
  .refine((value) => {
    if (!value) {
      return true;
    }
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, { message: '请输入有效的 JSON 字符串' });

export const jobFormSchema = z.object({
  jobName: z.string().trim().min(1, '请输入任务名称'),
  jobGroup: z.string().trim().min(1, '请输入任务分组'),
  invokeTarget: z.string().trim().min(1, '请输入调用目标'),
  cronExpression: z.string().trim().min(1, '请输入 Cron 表达式'),
  misfirePolicy: z.enum(['1', '2', '3']),
  concurrent: z.enum(['0', '1']),
  status: z.enum(['0', '1']),
  remark: z.string().optional(),
  invokeParams: jsonTextSchema,
});

export type JobFormValues = z.infer<typeof jobFormSchema>;
