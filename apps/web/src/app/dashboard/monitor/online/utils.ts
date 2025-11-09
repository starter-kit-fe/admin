'use client';

import type { TimeRangeValue } from './constants';
import { TIME_RANGE_OPTIONS } from './constants';
import type { OnlineUser, OnlineUserListResponse } from './type';

export function resolveSinceValue(timeRange: TimeRangeValue) {
  const option = TIME_RANGE_OPTIONS.find((item) => item.value === timeRange);
  if (!option || !option.minutes) {
    return undefined;
  }
  const now = Date.now();
  const millis = option.minutes * 60 * 1000;
  return new Date(now - millis).toISOString();
}

export function resolveOnlineUserIdentifier(user: OnlineUser): string | null {
  if (typeof user.infoId === 'number' && Number.isFinite(user.infoId)) {
    return String(user.infoId);
  }

  const candidates = [user.tokenId, user.sessionId, user.uuid];
  const found = candidates.find(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  );

  if (found) {
    return found;
  }

  return null;
}

export function getOnlineUserRowId(user: OnlineUser) {
  const identifier = resolveOnlineUserIdentifier(user);
  if (identifier) {
    return identifier;
  }
  const fallback = [
    user.userName || 'unknown',
    user.ipaddr || 'ip',
    user.loginTime || user.lastAccessTime || 'time',
  ];
  return fallback.join('|');
}

export function extractOnlineUserIdentifiers(users: OnlineUser[]) {
  const ids: string[] = [];
  let skipped = 0;
  users.forEach((user) => {
    const identifier = resolveOnlineUserIdentifier(user);
    if (identifier) {
      ids.push(identifier);
    } else {
      skipped += 1;
    }
  });
  return { ids, skipped };
}

export function resolveStatusBadgeVariant(status?: string | null) {
  return status === '0' ? 'secondary' : 'outline';
}

export function normalizeOnlineUserResponse(
  data: OnlineUserListResponse | OnlineUser[] | undefined,
  pagination: { pageNum: number; pageSize: number },
) {
  if (!data) {
    return { rows: [] as OnlineUser[], total: 0 };
  }

  if (Array.isArray(data)) {
    const total = data.length;
    const start = (pagination.pageNum - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return { rows: data.slice(start, end), total };
  }

  return {
    rows: data.items ?? [],
    total: typeof data.total === 'number' ? data.total : data.items.length,
  };
}
