'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import {
  BASE_TYPE_QUERY_KEY,
  DATA_STATUS_TABS,
  TYPE_STATUS_TABS,
} from './constants';
import type { DictData, DictType } from './type';

export type TypeStatusValue = (typeof TYPE_STATUS_TABS)[number]['value'];
export type DataStatusValue = (typeof DATA_STATUS_TABS)[number]['value'];

type TypeFilterState = {
  dictName: string;
  dictType: string;
};

type DataFilterState = {
  dictLabel: string;
  dictValue: string;
};

type TypeEditorState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; dictType: DictType };

type DataEditorState =
  | { open: false }
  | { open: true; mode: 'create'; dictType: DictType }
  | {
      open: true;
      mode: 'edit';
      dictType: DictType;
      dictData: DictData;
    };

type DataDeleteTarget =
  | null
  | {
      dictType: DictType;
      dictData: DictData;
    };

type SetStateAction<T> = T | ((prev: T) => T);

const noopRefresh = () => {};

const typeStatusAtom = atom<TypeStatusValue>('all');
const typeFilterFormAtom = atom<TypeFilterState>({
  dictName: '',
  dictType: '',
});
const typeAppliedFiltersAtom = atom<TypeFilterState>({
  dictName: '',
  dictType: '',
});

const dataStatusAtom = atom<DataStatusValue>('all');
const dataFilterFormAtom = atom<DataFilterState>({
  dictLabel: '',
  dictValue: '',
});
const dataAppliedFiltersAtom = atom<DataFilterState>({
  dictLabel: '',
  dictValue: '',
});

const dictTypesAtom = atom<DictType[]>([]);
const selectedDictIdAtom = atom<number | null>(null);
const dictDataAtom = atom<DictData[]>([]);
const dictDataTotalAtom = atom<number>(0);

const typeEditorStateAtom = atom<TypeEditorState>({ open: false });
const dataEditorStateAtom = atom<DataEditorState>({ open: false });

const typeDeleteTargetAtom = atom<DictType | null>(null);
const dataDeleteTargetAtom = atom<DataDeleteTarget>(null);

const refreshingAtom = atom(false);
const activeMutationsAtom = atom(0);
const isMutatingAtom = atom((get) => get(activeMutationsAtom) > 0);
const refreshActionAtom = atom<{ current: () => void }>({
  current: noopRefresh,
});

const setTypeStatusAtom = atom(
  null,
  (_get, set, value: TypeStatusValue) => {
    set(typeStatusAtom, value);
  },
);

const setTypeFilterFormAtom = atom(
  null,
  (get, set, action: SetStateAction<TypeFilterState>) => {
    const current = get(typeFilterFormAtom);
    const next =
      typeof action === 'function'
        ? (action as (prev: TypeFilterState) => TypeFilterState)(current)
        : action;
    set(typeFilterFormAtom, { ...next });
  },
);

const applyTypeFiltersAtom = atom(
  null,
  (
    _get,
    set,
    payload: { filters: TypeFilterState; force?: boolean },
  ) => {
    set(typeAppliedFiltersAtom, { ...payload.filters });
  },
);

const resetTypeFiltersAtom = atom(null, (_get, set) => {
  set(typeFilterFormAtom, { dictName: '', dictType: '' });
  set(typeAppliedFiltersAtom, { dictName: '', dictType: '' });
});

const setDataStatusAtom = atom(
  null,
  (_get, set, value: DataStatusValue) => {
    set(dataStatusAtom, value);
  },
);

const setDataFilterFormAtom = atom(
  null,
  (get, set, action: SetStateAction<DataFilterState>) => {
    const current = get(dataFilterFormAtom);
    const next =
      typeof action === 'function'
        ? (action as (prev: DataFilterState) => DataFilterState)(current)
        : action;
    set(dataFilterFormAtom, { ...next });
  },
);

const applyDataFiltersAtom = atom(
  null,
  (
    _get,
    set,
    payload: { filters: DataFilterState; force?: boolean },
  ) => {
    set(dataAppliedFiltersAtom, { ...payload.filters });
  },
);

const resetDataFiltersAtom = atom(null, (_get, set) => {
  set(dataFilterFormAtom, { dictLabel: '', dictValue: '' });
  set(dataAppliedFiltersAtom, { dictLabel: '', dictValue: '' });
});

const setDictTypesAtom = atom(
  null,
  (_get, set, types: DictType[]) => {
    set(dictTypesAtom, types);
  },
);

const setSelectedDictIdAtom = atom(
  null,
  (get, set, action: SetStateAction<number | null>) => {
    const current = get(selectedDictIdAtom);
    const next =
      typeof action === 'function'
        ? (action as (prev: number | null) => number | null)(current)
        : action;
    set(selectedDictIdAtom, next);
  },
);

const setDictDataAtom = atom(
  null,
  (_get, set, data: DictData[]) => {
    set(dictDataAtom, data);
  },
);

const setDictDataTotalAtom = atom(
  null,
  (_get, set, total: number) => {
    set(dictDataTotalAtom, total);
  },
);

const openTypeCreateAtom = atom(null, (_get, set) => {
  set(typeEditorStateAtom, { open: true, mode: 'create' });
});

const openTypeEditAtom = atom(null, (_get, set, dict: DictType) => {
  set(typeEditorStateAtom, { open: true, mode: 'edit', dictType: dict });
});

const closeTypeEditorAtom = atom(null, (_get, set) => {
  set(typeEditorStateAtom, { open: false });
});

const openDataCreateAtom = atom(
  null,
  (_get, set, dict: DictType) => {
    set(dataEditorStateAtom, { open: true, mode: 'create', dictType: dict });
  },
);

const openDataEditAtom = atom(
  null,
  (_get, set, payload: { dictType: DictType; dictData: DictData }) => {
    set(dataEditorStateAtom, {
      open: true,
      mode: 'edit',
      dictType: payload.dictType,
      dictData: payload.dictData,
    });
  },
);

const closeDataEditorAtom = atom(null, (_get, set) => {
  set(dataEditorStateAtom, { open: false });
});

const setTypeDeleteTargetAtom = atom(
  null,
  (_get, set, dict: DictType | null) => {
    set(typeDeleteTargetAtom, dict);
  },
);

const setDataDeleteTargetAtom = atom(
  null,
  (_get, set, target: DataDeleteTarget) => {
    set(dataDeleteTargetAtom, target);
  },
);

const setRefreshingAtom = atom(null, (_get, set, value: boolean) => {
  set(refreshingAtom, value);
});

const incrementMutationsAtom = atom(null, (_get, set) => {
  set(activeMutationsAtom, (prev) => prev + 1);
});

const decrementMutationsAtom = atom(null, (_get, set) => {
  set(activeMutationsAtom, (prev) => (prev > 0 ? prev - 1 : 0));
});

const setRefreshActionAtom = atom(
  null,
  (_get, set, handler: () => void) => {
    set(refreshActionAtom, { current: handler });
  },
);

export interface DictManagementStore {
  typeStatus: TypeStatusValue;
  setTypeStatus: (value: TypeStatusValue) => void;
  typeFilterForm: TypeFilterState;
  setTypeFilterForm: (action: SetStateAction<TypeFilterState>) => void;
  typeAppliedFilters: TypeFilterState;
  applyTypeFilters: (
    filters: TypeFilterState,
    options?: { force?: boolean },
  ) => void;
  resetTypeFilters: () => void;

  dataStatus: DataStatusValue;
  setDataStatus: (value: DataStatusValue) => void;
  dataFilterForm: DataFilterState;
  setDataFilterForm: (action: SetStateAction<DataFilterState>) => void;
  dataAppliedFilters: DataFilterState;
  applyDataFilters: (
    filters: DataFilterState,
    options?: { force?: boolean },
  ) => void;
  resetDataFilters: () => void;

  dictTypes: DictType[];
  setDictTypes: (types: DictType[]) => void;
  selectedDictId: number | null;
  setSelectedDictId: (dictId: SetStateAction<number | null>) => void;

  dictData: DictData[];
  setDictData: (data: DictData[]) => void;
  dictDataTotal: number;
  setDictDataTotal: (total: number) => void;

  typeEditorState: TypeEditorState;
  openTypeCreate: () => void;
  openTypeEdit: (dictType: DictType) => void;
  closeTypeEditor: () => void;

  dataEditorState: DataEditorState;
  openDataCreate: (dictType: DictType) => void;
  openDataEdit: (payload: { dictType: DictType; dictData: DictData }) => void;
  closeDataEditor: () => void;

  typeDeleteTarget: DictType | null;
  setTypeDeleteTarget: (dictType: DictType | null) => void;
  dataDeleteTarget: DataDeleteTarget;
  setDataDeleteTarget: (target: DataDeleteTarget) => void;
}

export const useDictManagementStore = (): DictManagementStore => {
  const typeStatus = useAtomValue(typeStatusAtom);
  const typeFilterForm = useAtomValue(typeFilterFormAtom);
  const typeAppliedFilters = useAtomValue(typeAppliedFiltersAtom);

  const dataStatus = useAtomValue(dataStatusAtom);
  const dataFilterForm = useAtomValue(dataFilterFormAtom);
  const dataAppliedFilters = useAtomValue(dataAppliedFiltersAtom);

  const dictTypes = useAtomValue(dictTypesAtom);
  const selectedDictId = useAtomValue(selectedDictIdAtom);
  const dictData = useAtomValue(dictDataAtom);
  const dictDataTotal = useAtomValue(dictDataTotalAtom);

  const typeEditorState = useAtomValue(typeEditorStateAtom);
  const dataEditorState = useAtomValue(dataEditorStateAtom);

  const typeDeleteTarget = useAtomValue(typeDeleteTargetAtom);
  const dataDeleteTarget = useAtomValue(dataDeleteTargetAtom);

  const setTypeStatus = useSetAtom(setTypeStatusAtom);
  const setTypeFilterForm = useSetAtom(setTypeFilterFormAtom);
  const applyTypeFiltersSetter = useSetAtom(applyTypeFiltersAtom);
  const resetTypeFilters = useSetAtom(resetTypeFiltersAtom);

  const setDataStatus = useSetAtom(setDataStatusAtom);
  const setDataFilterForm = useSetAtom(setDataFilterFormAtom);
  const applyDataFiltersSetter = useSetAtom(applyDataFiltersAtom);
  const resetDataFilters = useSetAtom(resetDataFiltersAtom);

  const setDictTypes = useSetAtom(setDictTypesAtom);
  const setSelectedDictId = useSetAtom(setSelectedDictIdAtom);
  const setDictData = useSetAtom(setDictDataAtom);
  const setDictDataTotal = useSetAtom(setDictDataTotalAtom);

  const openTypeCreate = useSetAtom(openTypeCreateAtom);
  const openTypeEdit = useSetAtom(openTypeEditAtom);
  const closeTypeEditor = useSetAtom(closeTypeEditorAtom);

  const openDataCreate = useSetAtom(openDataCreateAtom);
  const openDataEdit = useSetAtom(openDataEditAtom);
  const closeDataEditor = useSetAtom(closeDataEditorAtom);

  const setTypeDeleteTarget = useSetAtom(setTypeDeleteTargetAtom);
  const setDataDeleteTarget = useSetAtom(setDataDeleteTargetAtom);

  const applyTypeFilters = (
    filters: TypeFilterState,
    options?: { force?: boolean },
  ) => {
    applyTypeFiltersSetter({ filters, force: options?.force });
  };

  const applyDataFilters = (
    filters: DataFilterState,
    options?: { force?: boolean },
  ) => {
    applyDataFiltersSetter({ filters, force: options?.force });
  };

  return {
    typeStatus,
    setTypeStatus,
    typeFilterForm,
    setTypeFilterForm,
    typeAppliedFilters,
    applyTypeFilters,
    resetTypeFilters,
    dataStatus,
    setDataStatus,
    dataFilterForm,
    setDataFilterForm,
    dataAppliedFilters,
    applyDataFilters,
    resetDataFilters,
    dictTypes,
    setDictTypes,
    selectedDictId,
    setSelectedDictId,
    dictData,
    setDictData,
    dictDataTotal,
    setDictDataTotal,
    typeEditorState,
    openTypeCreate,
    openTypeEdit,
    closeTypeEditor,
    dataEditorState,
    openDataCreate,
    openDataEdit,
    closeDataEditor,
    typeDeleteTarget,
    setTypeDeleteTarget,
    dataDeleteTarget,
    setDataDeleteTarget,
  };
};

export const useDictManagementStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useDictManagementRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useDictManagementSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useDictManagementMutationCounter = () => {
  const begin = useSetAtom(incrementMutationsAtom);
  const end = useSetAtom(decrementMutationsAtom);
  return { beginMutation: begin, endMutation: end };
};

export const useDictManagementSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);
