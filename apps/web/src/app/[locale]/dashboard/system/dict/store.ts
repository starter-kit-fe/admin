'use client';

import { useCallback } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';

import { DATA_STATUS_TABS, TYPE_STATUS_TABS } from './constants';
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

const useApplyTypeFiltersHandler = () => {
  const applyTypeFiltersSetter = useSetAtom(applyTypeFiltersAtom);
  return useCallback(
    (filters: TypeFilterState, options?: { force?: boolean }) => {
      applyTypeFiltersSetter({ filters, force: options?.force });
    },
    [applyTypeFiltersSetter],
  );
};

const useApplyDataFiltersHandler = () => {
  const applyDataFiltersSetter = useSetAtom(applyDataFiltersAtom);
  return useCallback(
    (filters: DataFilterState, options?: { force?: boolean }) => {
      applyDataFiltersSetter({ filters, force: options?.force });
    },
    [applyDataFiltersSetter],
  );
};

export const useDictTypeStatus = () => {
  const typeStatus = useAtomValue(typeStatusAtom);
  const setTypeStatus = useSetAtom(setTypeStatusAtom);
  return { typeStatus, setTypeStatus };
};

export const useDictTypeFilterForm = () => {
  const typeFilterForm = useAtomValue(typeFilterFormAtom);
  const setTypeFilterForm = useSetAtom(setTypeFilterFormAtom);
  return { typeFilterForm, setTypeFilterForm };
};

export const useDictTypeAppliedFilters = () => {
  const typeAppliedFilters = useAtomValue(typeAppliedFiltersAtom);
  const applyTypeFilters = useApplyTypeFiltersHandler();
  const resetTypeFilters = useSetAtom(resetTypeFiltersAtom);
  return { typeAppliedFilters, applyTypeFilters, resetTypeFilters };
};

export const useDictDataStatus = () => {
  const dataStatus = useAtomValue(dataStatusAtom);
  const setDataStatus = useSetAtom(setDataStatusAtom);
  return { dataStatus, setDataStatus };
};

export const useDictDataFilterForm = () => {
  const dataFilterForm = useAtomValue(dataFilterFormAtom);
  const setDataFilterForm = useSetAtom(setDataFilterFormAtom);
  return { dataFilterForm, setDataFilterForm };
};

export const useDictDataAppliedFilters = () => {
  const dataAppliedFilters = useAtomValue(dataAppliedFiltersAtom);
  const applyDataFilters = useApplyDataFiltersHandler();
  const resetDataFilters = useSetAtom(resetDataFiltersAtom);
  return { dataAppliedFilters, applyDataFilters, resetDataFilters };
};

export const useDictDataFilterActions = () => {
  const setDataFilterForm = useSetAtom(setDataFilterFormAtom);
  const applyDataFilters = useApplyDataFiltersHandler();
  const resetDataFilters = useSetAtom(resetDataFiltersAtom);
  return { setDataFilterForm, applyDataFilters, resetDataFilters };
};

export const useDictTypesState = () => {
  const dictTypes = useAtomValue(dictTypesAtom);
  const setDictTypes = useSetAtom(setDictTypesAtom);
  return { dictTypes, setDictTypes };
};

export const useDictSelection = () => {
  const selectedDictId = useAtomValue(selectedDictIdAtom);
  const setSelectedDictId = useSetAtom(setSelectedDictIdAtom);
  return { selectedDictId, setSelectedDictId };
};

export const useDictDataState = () => {
  const dictData = useAtomValue(dictDataAtom);
  const setDictData = useSetAtom(setDictDataAtom);
  const dictDataTotal = useAtomValue(dictDataTotalAtom);
  const setDictDataTotal = useSetAtom(setDictDataTotalAtom);
  return { dictData, setDictData, dictDataTotal, setDictDataTotal };
};

export const useDictTypeEditorState = () => useAtomValue(typeEditorStateAtom);

export const useDictTypeEditorActions = () => {
  const openTypeCreate = useSetAtom(openTypeCreateAtom);
  const openTypeEdit = useSetAtom(openTypeEditAtom);
  const closeTypeEditor = useSetAtom(closeTypeEditorAtom);
  return { openTypeCreate, openTypeEdit, closeTypeEditor };
};

export const useDictDataEditorState = () => useAtomValue(dataEditorStateAtom);

export const useDictDataEditorActions = () => {
  const openDataCreate = useSetAtom(openDataCreateAtom);
  const openDataEdit = useSetAtom(openDataEditAtom);
  const closeDataEditor = useSetAtom(closeDataEditorAtom);
  return { openDataCreate, openDataEdit, closeDataEditor };
};

export const useDictTypeDeleteState = () => {
  const typeDeleteTarget = useAtomValue(typeDeleteTargetAtom);
  const setTypeDeleteTarget = useSetAtom(setTypeDeleteTargetAtom);
  return { typeDeleteTarget, setTypeDeleteTarget };
};

export const useDictDataDeleteState = () => {
  const dataDeleteTarget = useAtomValue(dataDeleteTargetAtom);
  const setDataDeleteTarget = useSetAtom(setDataDeleteTargetAtom);
  return { dataDeleteTarget, setDataDeleteTarget };
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
