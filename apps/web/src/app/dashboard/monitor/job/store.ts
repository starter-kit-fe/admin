'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import {
  DEFAULT_FILTERS,
  DEFAULT_PAGINATION,
  type JobFilterState,
  type PaginationState,
} from './constants';
import type { Job } from './type';

type SetStateAction<T> = T | ((prev: T) => T);

const noopRefresh = () => {};

const filterFormAtom = atom<JobFilterState>({ ...DEFAULT_FILTERS });
const appliedFiltersAtom = atom<JobFilterState>({ ...DEFAULT_FILTERS });
const paginationAtom = atom<PaginationState>({ ...DEFAULT_PAGINATION });
const deleteTargetAtom = atom<Job | null>(null);
const editorAtom = atom<JobEditorState | null>(null);
const refreshingAtom = atom(false);
const activeMutationsAtom = atom(0);
const isMutatingAtom = atom((get) => get(activeMutationsAtom) > 0);
const refreshActionAtom = atom<{ current: () => void }>({
  current: noopRefresh,
});

const setFilterFormAtom = atom(
  null,
  (get, set, action: SetStateAction<JobFilterState>) => {
    const current = get(filterFormAtom);
    const next =
      typeof action === 'function'
        ? (action as (prev: JobFilterState) => JobFilterState)(current)
        : action;
    set(filterFormAtom, { ...next });
  },
);

const applyFiltersAtom = atom(
  null,
  (
    get,
    set,
    payload: { filters: JobFilterState; force?: boolean },
  ) => {
    const { filters, force = false } = payload;
    const normalized: JobFilterState = {
      jobName: filters.jobName.trim(),
      jobGroup: filters.jobGroup.trim(),
      status: filters.status,
    };
    const previous = get(appliedFiltersAtom);
    const hasChanged =
      force ||
      previous.jobName !== normalized.jobName ||
      previous.jobGroup !== normalized.jobGroup ||
      previous.status !== normalized.status;

    if (!hasChanged) {
      return;
    }

    set(appliedFiltersAtom, normalized);
    set(filterFormAtom, normalized);
    set(paginationAtom, { ...DEFAULT_PAGINATION });
  },
);

const resetFiltersAtom = atom(null, (_get, set) => {
  set(filterFormAtom, { ...DEFAULT_FILTERS });
  set(appliedFiltersAtom, { ...DEFAULT_FILTERS });
  set(paginationAtom, { ...DEFAULT_PAGINATION });
});

const setPaginationAtom = atom(
  null,
  (get, set, action: SetStateAction<PaginationState>) => {
    const current = get(paginationAtom);
    const next =
      typeof action === 'function'
        ? (action as (prev: PaginationState) => PaginationState)(current)
        : action;
    set(paginationAtom, { ...next });
  },
);

const setDeleteTargetAtom = atom(null, (_get, set, job: Job | null) => {
  set(deleteTargetAtom, job);
});

const setEditorAtom = atom(
  null,
  (_get, set, editorState: JobEditorState | null) => {
    set(editorAtom, editorState);
  },
);

const setRefreshingAtom = atom(
  null,
  (_get, set, value: boolean) => {
    set(refreshingAtom, value);
  },
);

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

export interface JobManagementStore {
  filterForm: JobFilterState;
  setFilterForm: (action: SetStateAction<JobFilterState>) => void;
  appliedFilters: JobFilterState;
  applyFilters: (
    filters: JobFilterState,
    options?: { force?: boolean },
  ) => void;
  resetFilters: () => void;
  pagination: PaginationState;
  setPagination: (action: SetStateAction<PaginationState>) => void;
  deleteTarget: Job | null;
  setDeleteTarget: (job: Job | null) => void;
  editorState: JobEditorState | null;
  openCreateEditor: () => void;
  openEditEditor: (job: Job) => void;
  closeEditor: () => void;
}

export const useJobManagementStore = (): JobManagementStore => {
  const filterForm = useAtomValue(filterFormAtom);
  const appliedFilters = useAtomValue(appliedFiltersAtom);
  const pagination = useAtomValue(paginationAtom);
  const deleteTarget = useAtomValue(deleteTargetAtom);
  const editorState = useAtomValue(editorAtom);

  const setFilterForm = useSetAtom(setFilterFormAtom);
  const applyFiltersSetter = useSetAtom(applyFiltersAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const setPagination = useSetAtom(setPaginationAtom);
  const setDeleteTarget = useSetAtom(setDeleteTargetAtom);
  const setEditorState = useSetAtom(setEditorAtom);

  const applyFilters = (
    filters: JobFilterState,
    options?: { force?: boolean },
  ) => {
    applyFiltersSetter({ filters, force: options?.force });
  };

  return {
    filterForm,
    setFilterForm,
    appliedFilters,
    applyFilters,
    resetFilters,
    pagination,
    setPagination,
    deleteTarget,
    setDeleteTarget,
    editorState,
    openCreateEditor: () => setEditorState({ mode: 'create', job: null }),
    openEditEditor: (job: Job) => setEditorState({ mode: 'edit', job }),
    closeEditor: () => setEditorState(null),
  };
};

export const useJobManagementStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useJobManagementSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useJobManagementMutationCounter = () => {
  const beginMutation = useSetAtom(incrementMutationsAtom);
  const endMutation = useSetAtom(decrementMutationsAtom);
  return { beginMutation, endMutation };
};

export const useJobManagementRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useJobManagementSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);

type JobEditorState =
  | { mode: 'create'; job: null }
  | { mode: 'edit'; job: Job };
