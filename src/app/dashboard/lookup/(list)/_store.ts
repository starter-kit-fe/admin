import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { groupRequest, List, listRequest } from './_type';
export interface State {
  currentGroup: List | null;
  groupParams: groupRequest;
  listParams: listRequest;
  setState: <K extends keyof State>(key: K, value: State[K]) => void;
  reset: () => void;
}
export const initialState = {
  currentGroup: null,
  groupParams: {
    page: '1',
    size: '10',
    name: '',
    status: 'all',
  },
  listParams: {
    status: 'all',
    name: '',
  },
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...initialState,
      setState: (key, value) => set((state) => ({ ...state, [key]: value })),
      reset: () => set(initialState),
    }),
    {
      name: 'lookup', // unique name
      storage: createJSONStorage(() => sessionStorage), // or localStorage
    }
  )
);
