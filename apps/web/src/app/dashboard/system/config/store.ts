'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import { CONFIG_TYPE_TABS } from './constants';
import type { SystemConfig } from './type';

export type ConfigTypeValue = (typeof CONFIG_TYPE_TABS)[number]['value'];

type FilterState = {
  configName: string;
  configKey: string;
};

type EditorState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; config: SystemConfig };

type SetStateAction<T> = T | ((prev: T) => T);

const noopRefresh = () => {};

const configTypeAtom = atom<ConfigTypeValue>('all');
const filterFormAtom = atom<FilterState>({ configName: '', configKey: '' });
const appliedFiltersAtom = atom<FilterState>({ configName: '', configKey: '' });
const selectedIdsAtom = atom<Set<number>>(new Set([0]));

const configsAtom = atom<SystemConfig[]>([]);

const editorStateAtom = atom<EditorState>({ open: false });
const deleteTargetAtom = atom<SystemConfig | null>(null);
const bulkDeleteOpenAtom = atom(false);

const refreshingAtom = atom(false);
const activeMutationsAtom = atom(0);
const isMutatingAtom = atom((get) => get(activeMutationsAtom) > 0);
const refreshActionAtom = atom<{ current: () => void }>({
  current: noopRefresh,
});

const setConfigTypeAtom = atom(null, (_get, set, value: ConfigTypeValue) => {
  set(configTypeAtom, value);
  set(selectedIdsAtom, new Set());
});

const setFilterFormAtom = atom(
  null,
  (get, set, action: SetStateAction<FilterState>) => {
    const current = get(filterFormAtom);
    const next =
      typeof action === 'function'
        ? (action as (prev: FilterState) => FilterState)(current)
        : action;
    set(filterFormAtom, { ...next });
  },
);

const applyFiltersAtom = atom(
  null,
  (_get, set, payload: { filters: FilterState; force?: boolean }) => {
    set(appliedFiltersAtom, { ...payload.filters });
  },
);

const resetFiltersAtom = atom(null, (_get, set) => {
  set(filterFormAtom, { configName: '', configKey: '' });
  set(appliedFiltersAtom, { configName: '', configKey: '' });
  set(selectedIdsAtom, new Set());
});

const setConfigsAtom = atom(null, (_get, set, configs: SystemConfig[]) => {
  set(configsAtom, configs);
});

const openCreateAtom = atom(null, (_get, set) => {
  set(editorStateAtom, { open: true, mode: 'create' });
});

const openEditAtom = atom(null, (_get, set, config: SystemConfig) => {
  set(editorStateAtom, { open: true, mode: 'edit', config });
});

const closeEditorAtom = atom(null, (_get, set) => {
  set(editorStateAtom, { open: false });
});

const setDeleteTargetAtom = atom(
  null,
  (_get, set, config: SystemConfig | null) => {
    set(deleteTargetAtom, config);
  },
);

const setSelectedIdsAtom = atom(
  null,
  (get, set, action: SetStateAction<Set<number>>) => {
    const current = get(selectedIdsAtom);
    const base = new Set(current);
    const resolved =
      typeof action === 'function'
        ? (action as (prev: Set<number>) => Set<number>)(base)
        : action;
    set(selectedIdsAtom, new Set(resolved));
  },
);

const clearSelectedIdsAtom = atom(null, (_get, set) => {
  set(selectedIdsAtom, new Set());
});

const setRefreshingAtom = atom(null, (_get, set, value: boolean) => {
  set(refreshingAtom, value);
});

const incrementMutationsAtom = atom(null, (_get, set) => {
  set(activeMutationsAtom, (prev) => prev + 1);
});

const decrementMutationsAtom = atom(null, (_get, set) => {
  set(activeMutationsAtom, (prev) => (prev > 0 ? prev - 1 : 0));
});

const setRefreshActionAtom = atom(null, (_get, set, handler: () => void) => {
  set(refreshActionAtom, { current: handler });
});

const setBulkDeleteOpenAtom = atom(null, (_get, set, open: boolean) => {
  set(bulkDeleteOpenAtom, open);
});

export interface ConfigManagementStore {
  configType: ConfigTypeValue;
  setConfigType: (value: ConfigTypeValue) => void;
  filterForm: FilterState;
  setFilterForm: (action: SetStateAction<FilterState>) => void;
  appliedFilters: FilterState;
  applyFilters: (filters: FilterState, options?: { force?: boolean }) => void;
  resetFilters: () => void;
  selectedIds: Set<number>;
  setSelectedIds: (action: SetStateAction<Set<number>>) => void;
  clearSelectedIds: () => void;
  bulkDeleteOpen: boolean;
  setBulkDeleteOpen: (open: boolean) => void;
  configs: SystemConfig[];
  setConfigs: (configs: SystemConfig[]) => void;
  editorState: EditorState;
  openCreate: () => void;
  openEdit: (config: SystemConfig) => void;
  closeEditor: () => void;
  deleteTarget: SystemConfig | null;
  setDeleteTarget: (config: SystemConfig | null) => void;
}

export const useConfigManagementStore = (): ConfigManagementStore => {
  const configType = useAtomValue(configTypeAtom);
  const filterForm = useAtomValue(filterFormAtom);
  const appliedFilters = useAtomValue(appliedFiltersAtom);
  const selectedIds = useAtomValue(selectedIdsAtom);
  const configs = useAtomValue(configsAtom);
  const editorState = useAtomValue(editorStateAtom);
  const deleteTarget = useAtomValue(deleteTargetAtom);
  const bulkDeleteOpen = useAtomValue(bulkDeleteOpenAtom);

  const setConfigType = useSetAtom(setConfigTypeAtom);
  const setFilterForm = useSetAtom(setFilterFormAtom);
  const applyFiltersSetter = useSetAtom(applyFiltersAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const setSelectedIds = useSetAtom(setSelectedIdsAtom);
  const clearSelectedIds = useSetAtom(clearSelectedIdsAtom);
  const setConfigs = useSetAtom(setConfigsAtom);
  const openCreate = useSetAtom(openCreateAtom);
  const openEdit = useSetAtom(openEditAtom);
  const closeEditor = useSetAtom(closeEditorAtom);
  const setDeleteTarget = useSetAtom(setDeleteTargetAtom);
  const setBulkDeleteOpen = useSetAtom(setBulkDeleteOpenAtom);

  const applyFilters = (
    filters: FilterState,
    options?: { force?: boolean },
  ) => {
    applyFiltersSetter({ filters, force: options?.force });
  };

  return {
    configType,
    setConfigType,
    filterForm,
    setFilterForm,
    appliedFilters,
    applyFilters,
    resetFilters,
    selectedIds,
    setSelectedIds,
    clearSelectedIds,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    configs,
    setConfigs,
    editorState,
    openCreate,
    openEdit,
    closeEditor,
    deleteTarget,
    setDeleteTarget,
  };
};

export const useConfigManagementStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useConfigManagementRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useConfigManagementSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useConfigManagementMutationCounter = () => {
  const begin = useSetAtom(incrementMutationsAtom);
  const end = useSetAtom(decrementMutationsAtom);
  return {
    beginMutation: begin,
    endMutation: end,
  };
};

export const useConfigManagementSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);
