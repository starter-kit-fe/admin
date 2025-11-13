'use client';

import { User } from '@/types';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useEffect, useState } from 'react';

interface StoredAuthState {
  permissions: string[] | null;
  roles: string[] | null;
  user: User | null;
}

export interface AuthState extends StoredAuthState {
  readonly isAuthenticated: boolean;
  setPermissions: (permissions: string[] | null) => void;
  setRoles: (roles: string[] | null) => void;
  setUser: (user: User | null) => void;
}

const defaultAuthState: StoredAuthState = {
  user: null,
  roles: null,
  permissions: null,
};

const authAtom = atomWithStorage<StoredAuthState>(
  'auth-storage',
  defaultAuthState,
  undefined,
  { getOnInit: false },
);

const isAuthenticatedAtom = atom((get) => Boolean(get(authAtom).user));

const setUserAtom = atom(null, (_get, set, user: User | null) => {
  set(authAtom, (prev) => ({
    ...prev,
    user,
  }));
});

const setRolesAtom = atom(null, (_get, set, roles: string[] | null) => {
  set(authAtom, (prev) => ({
    ...prev,
    roles,
  }));
});

const setPermissionsAtom = atom(
  null,
  (_get, set, permissions: string[] | null) => {
    set(authAtom, (prev) => ({
      ...prev,
      permissions,
    }));
  },
);

function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}

export const useAuthStore = (): AuthState => {
  const { user, roles, permissions } = useAtomValue(authAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const setUser = useSetAtom(setUserAtom);
  const setRoles = useSetAtom(setRolesAtom);
  const setPermissions = useSetAtom(setPermissionsAtom);
  const hasHydrated = useHasHydrated();

  return {
    user: hasHydrated ? user : defaultAuthState.user,
    roles: hasHydrated ? roles : defaultAuthState.roles,
    permissions: hasHydrated ? permissions : defaultAuthState.permissions,
    isAuthenticated: hasHydrated ? isAuthenticated : false,
    setUser,
    setRoles,
    setPermissions,
  };
};
