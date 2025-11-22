export function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
}

export function getLoginStatusBadgeVariant(status?: string | null) {
  return status === '0' ? 'secondary' : 'destructive';
}
