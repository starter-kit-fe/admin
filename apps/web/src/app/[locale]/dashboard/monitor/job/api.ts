import { del, get, patch, post } from '@/lib/request';

import type { Job, JobListResponse } from './type';

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

export function runJob(jobId: number) {
  return post(`/v1/monitor/jobs/${jobId}/run`);
}

export function changeJobStatus(jobId: number, status: string) {
  return patch(`/v1/monitor/jobs/${jobId}/status`, { status });
}

export function deleteJob(jobId: number) {
  return del(`/v1/monitor/jobs/${jobId}`);
}

export function getJob(jobId: number) {
  return get<Job>(`/v1/monitor/jobs/${jobId}`);
}
