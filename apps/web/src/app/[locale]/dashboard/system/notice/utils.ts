import type { Notice, NoticeFormValues } from './type';

export function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

export function toFormValues(notice: Notice): NoticeFormValues {
  return {
    noticeTitle: notice.noticeTitle ?? '',
    noticeType: notice.noticeType ?? '1',
    noticeContent: notice.noticeContent ?? '',
    status: notice.status ?? '0',
    remark: notice.remark ?? '',
  };
}
