import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user: string) => set({ user }),
    }),
    {
      name: 'user-storage', // 存储名称
      storage: createJSONStorage(() => localStorage), // 存储介质
    }
  )
);
