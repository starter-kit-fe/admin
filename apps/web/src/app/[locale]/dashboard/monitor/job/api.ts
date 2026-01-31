import { del, get, patch, post, put } from '@/lib/request';

import type {
  Job,
  JobDetailParams,
  JobDetailResponse,
  JobListResponse,
  JobLogStep,
} from './type';

export interface JobListParams {
  pageNum?: number;
  pageSize?: number;
  jobName?: string;
  jobGroup?: string;
  status?: string;
}

function buildQuery(params: JobListParams = {}) {
  const query: Record<string, string> = {};
  if (params.pageNum) {
    query.pageNum = String(params.pageNum);
  }
  if (params.pageSize) {
    query.pageSize = String(params.pageSize);
  }
  if (params.jobName && params.jobName.trim()) {
    query.jobName = params.jobName.trim();
  }
  if (params.jobGroup && params.jobGroup.trim()) {
    query.jobGroup = params.jobGroup.trim();
  }
  if (params.status && params.status.trim()) {
    query.status = params.status.trim();
  }
  return query;
}

export function listJobs(params: JobListParams = {}) {
  return get<JobListResponse>('/v1/monitor/jobs', buildQuery(params));
}

export interface RunJobResponse {
  jobLogId: number;
}

export function runJob(id: number) {
  return post<RunJobResponse>(`/v1/monitor/jobs/${id}/run`);
}

export function changeJobStatus(id: number, status: string) {
  return patch(`/v1/monitor/jobs/${id}/status`, { status });
}

export function deleteJob(id: number) {
  return del(`/v1/monitor/jobs/${id}`);
}

export function getJob(id: number) {
  return get<Job>(`/v1/monitor/jobs/${id}`);
}

export function getJobDetail(id: number, params: JobDetailParams = {}) {
  const query: Record<string, string> = {};
  if (params.logPageNum) {
    query.logPageNum = String(params.logPageNum);
  }
  if (params.logPageSize) {
    query.logPageSize = String(params.logPageSize);
  }
  return get<JobDetailResponse>(`/v1/monitor/jobs/${id}/detail`, query);
}

export interface JobPayload {
  jobName: string;
  jobGroup: string;
  invokeTarget: string;
  cronExpression: string;
  misfirePolicy: string;
  concurrent: string;
  status: string;
  remark?: string;
  invokeParams?: string;
}

export function createJob(payload: JobPayload) {
  return post('/v1/monitor/jobs', payload);
}

export function updateJob(id: number, payload: JobPayload) {
  return put(`/v1/monitor/jobs/${id}`, payload);
}

export function clearJobLogs(id: number) {
  return del(`/v1/monitor/jobs/${id}/logs`);
}

export function getJobLogSteps(jobLogId: number) {
  return get<JobLogStep[]>(`/v1/monitor/jobs/logs/${jobLogId}/steps`);
}
