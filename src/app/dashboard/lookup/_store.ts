import { ILookUP } from './_type';
import { create } from 'zustand';
// import {
//   createJSONStorage,
//   // persist,
//   PersistOptions
// } from "zustand/middleware";

// const STORAGE_KEY = "lookup-storage";

interface State {
  currentLookup: ILookUP.asObject | null;
  setCurrentLookup: (val: ILookUP.asObject) => void;
  removeCurrentLookup: () => void;

  currentGroup: ILookUP.listGroupItem | null;
  setCurrentGroup: (val: ILookUP.listGroupItem) => void;

  groupParams: ILookUP.listGroupParam | null;
  setGroupParams: (data: Partial<ILookUP.listGroupParam>) => void;

  params: ILookUP.listParam | null;
  setParams: (data: Partial<ILookUP.listParam>) => void;
  resetParams: () => void;
}
export const initGroupParams = {
  page: '1',
  size: '10',
  name: '',
  status: '',
};
export const initParams = {
  page: '1',
  size: '10',
  name: '',
  status: '',
  order: '',
  sort: '',
};

const createStore = (
  set: (fn: (state: State) => Partial<State>) => void
): State => ({
  currentLookup: null,
  setCurrentLookup: (params) =>
    set(() => ({
      currentLookup: params,
    })),
  removeCurrentLookup: () =>
    set(() => ({
      currentLookup: null,
    })),
  currentGroup: null,
  groupParams: initGroupParams,
  params: initParams,
  setGroupParams: (newParams) =>
    set((state) => ({
      groupParams: {
        ...state.groupParams,
        ...newParams,
      } as ILookUP.listGroupParam,
    })),
  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams } as ILookUP.listParam,
    })),
  setCurrentGroup: (step) => set(() => ({ currentGroup: step })),
  resetParams: () => set(() => ({ params: initParams })),
});

// const persistOptions: PersistOptions<State> = {
//   name: STORAGE_KEY,
//   storage: createJSONStorage(() => sessionStorage),
// };

export const useStore = create<State>()(createStore);
