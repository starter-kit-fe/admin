import { OPER_LOG_BUSINESS_TYPE_LABELS } from './constants';

export function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
}

export function getOperLogStatusLabel(status?: number | string | null) {
  return String(status) === '0' ? '成功' : '失败';
}

export function getOperLogStatusBadgeVariant(
  status?: number | string | null,
) {
  return String(status) === '0' ? 'secondary' : 'destructive';
}

export function getBusinessTypeLabel(value?: number | string | null) {
  if (value === null || value === undefined) {
    return '其它';
  }
  return (
    OPER_LOG_BUSINESS_TYPE_LABELS[String(value)] ??
    OPER_LOG_BUSINESS_TYPE_LABELS['0']
  );
}
