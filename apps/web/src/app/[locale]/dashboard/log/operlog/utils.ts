export function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
}

export function getOperLogStatusBadgeVariant(
  status?: number | string | null,
) {
  return String(status) === '0' ? 'secondary' : 'destructive';
}
