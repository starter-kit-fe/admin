import { del, get, post, put } from '@/lib/request';

import type { Notice } from './type';

export interface NoticeListParams {
  noticeTitle?: string;
  noticeType?: string;
  status?: string;
}

function buildQuery(params: NoticeListParams = {}) {
  const query: Record<string, string> = {};
  if (params.noticeTitle && params.noticeTitle.trim()) {
    query.noticeTitle = params.noticeTitle.trim();
  }
  if (params.noticeType && params.noticeType.trim()) {
    query.noticeType = params.noticeType.trim();
  }
  if (params.status && params.status.trim()) {
    query.status = params.status.trim();
  }
  return Object.keys(query).length > 0 ? query : undefined;
}

export function listNotices(params: NoticeListParams = {}) {
  return get<Notice[]>('/v1/system/notices', buildQuery(params));
}

export interface CreateNoticePayload {
  noticeTitle: string;
  noticeType: string;
  noticeContent: string;
  status?: string;
  remark?: string;
}

export interface UpdateNoticePayload extends Partial<CreateNoticePayload> {}

export function createNotice(payload: CreateNoticePayload) {
  return post<Notice>('/v1/system/notices', payload);
}

export function updateNotice(id: number, payload: UpdateNoticePayload) {
  return put<Notice>(`/v1/system/notices/${id}`, payload);
}

export function removeNotice(id: number) {
  return del(`/v1/system/notices/${id}`);
}
