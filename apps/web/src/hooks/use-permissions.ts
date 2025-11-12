'use client';

import { useCallback, useMemo } from 'react';

import { useAuthStore } from '@/app/login/store';

/**
 * Provides helpers to check whether the current user owns specific permission strings.
 */
export function usePermissions() {
  const { permissions } = useAuthStore();

  const resolvedPermissions = useMemo(() => {
    if (!Array.isArray(permissions)) {
      return [] as string[];
    }
    return permissions
      .map((permission) => permission?.trim())
      .filter(
        (permission): permission is string =>
          typeof permission === 'string' && permission.length > 0,
      );
  }, [permissions]);

  const permissionSet = useMemo(
    () => new Set(resolvedPermissions),
    [resolvedPermissions],
  );

  const hasPermission = useCallback(
    (...required: string[]) => {
      const normalized = required
        .map((permission) => permission?.trim())
        .filter((permission): permission is string => Boolean(permission));
      if (normalized.length === 0) {
        return true;
      }
      if (permissionSet.size === 0) {
        return false;
      }
      return normalized.every((permission) => permissionSet.has(permission));
    },
    [permissionSet],
  );

  const hasAnyPermission = useCallback(
    (...candidates: string[]) => {
      const normalized = candidates
        .map((permission) => permission?.trim())
        .filter((permission): permission is string => Boolean(permission));
      if (normalized.length === 0) {
        return true;
      }
      if (permissionSet.size === 0) {
        return false;
      }
      return normalized.some((permission) => permissionSet.has(permission));
    },
    [permissionSet],
  );

  return {
    permissions: resolvedPermissions,
    hasPermission,
    hasAnyPermission,
  };
}
