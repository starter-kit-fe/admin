'use client';

import { Button } from '@/components/ui/button';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { usePermissions } from '@/hooks/use-permissions';
import { forwardRef, useMemo, type ReactNode } from 'react';

type PermissionButtonProps = React.ComponentProps<typeof Button> & {
  required?: string | string[];
  strategy?: 'all' | 'any';
  fallback?: ReactNode | (() => ReactNode);
};

const normalizePermissions = (input?: string | string[]) => {
  if (!input) {
    return [];
  }
  const values = Array.isArray(input) ? input : [input];
  return values
    .map((permission) => permission?.trim())
    .filter((permission): permission is string => Boolean(permission));
};

const renderFallback = (fallback?: ReactNode | (() => ReactNode)) => {
  if (!fallback) {
    return null;
  }
  if (typeof fallback === 'function') {
    return fallback() ?? null;
  }
  return fallback;
};

export const PermissionButton = forwardRef<HTMLButtonElement, PermissionButtonProps>(
  ({ required, strategy = 'all', fallback, ...buttonProps }, ref) => {
    const isHydrated = useIsHydrated();
    const { hasPermission, hasAnyPermission } = usePermissions();

    const permissions = useMemo(() => normalizePermissions(required), [required]);

    const isAllowed =
      permissions.length === 0
        ? true
        : strategy === 'any'
          ? hasAnyPermission(...permissions)
          : hasPermission(...permissions);

    if (!isHydrated) {
      return null;
    }

    if (!isAllowed) {
      return renderFallback(fallback);
    }

    return <Button ref={ref} {...buttonProps} />;
  },
);

PermissionButton.displayName = 'PermissionButton';
