import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create((set) => ({
  user: null,
  setUser: (user: string) => set({ user }),
}));
