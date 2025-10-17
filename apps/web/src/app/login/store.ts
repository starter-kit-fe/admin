import { User } from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  readonly isAuthenticated: boolean;
  permissions: string[] | null;
  roles: string[] | null;
  user: User | null;

  setUser: (user: User | null) => void;
  setRoles: (roles: string[] | null) => void;
  setPermissions: (permissions: string[] | null) => void;
}

export const useStore = create<AuthState>()(
  persist(
    (set, get) => ({
      get isAuthenticated() {
        return !!get().user;
      },
      user: null,
      roles: null,
      permissions: null,
      setUser: (user: User | null) => set({ user }),
      setRoles: (roles: string[] | null) => set({ roles }),
      setPermissions: (permissions: string[] | null) => set({ permissions }),
    }),
    {
      name: 'auth-storage', // 存储的 key 名，存储在 localStorage 中
      storage: createJSONStorage(() => localStorage), // 使用 localStorage
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !['isAuthenticated'].includes(key),
          ),
        ),
    },
  ),
);
