import { ILookUP } from '../_type';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface State {
  currentItem: ILookUP.asObject | null;
  setCurrentItem: (val: ILookUP.asObject | null) => void;

  currentGroup: ILookUP.listGroupItem | null;
  setCurrentGroup: (val: ILookUP.listGroupItem | null) => void;

  groupParams: ILookUP.listGroupParam;
  setGroupParams: (data: Partial<ILookUP.listGroupParam>) => void;
  resetGroupParams: () => void;

  params: ILookUP.listParam;
  setParams: (data: Partial<ILookUP.listParam>) => void;
  resetParams: () => void;
}

export const initialGroupParams: ILookUP.listGroupParam = {
  page: '1',
  size: '10',
  name: '',
  status: '',
};

export const initialParams: ILookUP.listParam = {
  page: '1',
  size: '10',
  name: '',
  status: '',
  order: '',
  sort: '',
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      currentItem: null,
      currentGroup: null,
      params: initialParams,
      groupParams: initialGroupParams,
      setCurrentItem: (currentItem) => set({ currentItem }),
      setCurrentGroup: (currentGroup) => set({ currentGroup }),
      setParams: (filterParams) =>
        set((state) => ({ params: { ...state.params, ...filterParams } })),
      setGroupParams: (filterParams) =>
        set((state) => ({
          groupParams: { ...state.groupParams, ...filterParams },
        })),
      resetGroupParams: () => set({ groupParams: initialGroupParams }),
      resetParams: () => set({ params: initialParams }),
    }),
    {
      name: 'lookup', // unique name
      storage: createJSONStorage(() => sessionStorage), // or localStorage
    }
  )
);
