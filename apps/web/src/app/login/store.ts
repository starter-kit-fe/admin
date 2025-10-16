import { User } from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user: User | null) => set({ user }),
    }),
    {
      name: 'auth-storage', // 存储的 key 名，存储在 localStorage 中
      storage: createJSONStorage(() => localStorage), // 使用 localStorage
    },
  ),
);
