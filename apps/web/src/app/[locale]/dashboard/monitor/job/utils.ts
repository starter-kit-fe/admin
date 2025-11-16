export function resolveStatusLabel(
  status: string | null | undefined,
  labels: Record<string, string>,
) {
  if (status === '0') {
    return labels['0'] ?? '';
  }
  return labels['1'] ?? '';
}

export function resolveMisfireLabel(
  policy: string | null | undefined,
  labels: Record<string, string>,
) {
  const fallback = labels['3'] ?? '';
  if (!policy) {
    return fallback;
  }
  return labels[policy] ?? fallback;
}

export function resolveConcurrentLabel(
  flag: string | null | undefined,
  labels: Record<string, string>,
) {
  const fallback = labels['1'] ?? '';
  if (!flag) {
    return fallback;
  }
  return labels[flag] ?? fallback;
}
