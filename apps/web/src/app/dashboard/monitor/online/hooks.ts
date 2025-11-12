'use client';

import { useMemo } from 'react';

import { usePermissions } from '@/hooks/use-permissions';

import { ONLINE_PERMISSION_CODES } from './constants';

export function useOnlinePermissionFlags() {
  const { hasPermission } = usePermissions();

  return useMemo(
    () => ({
      canList: hasPermission(ONLINE_PERMISSION_CODES.list),
      canQuery: hasPermission(ONLINE_PERMISSION_CODES.query),
      canBatchLogout: hasPermission(ONLINE_PERMISSION_CODES.batchLogout),
      canForceLogout: hasPermission(ONLINE_PERMISSION_CODES.forceLogout),
    }),
    [hasPermission],
  );
}
