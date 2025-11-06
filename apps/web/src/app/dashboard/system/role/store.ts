'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import { DEFAULT_PAGINATION, STATUS_TABS } from './constants';
import type { Role } from './type';

export type StatusValue = (typeof STATUS_TABS)[number]['value'];

type PaginationState = {
  pageNum: number;
  pageSize: number;
};

type FilterState = {
  keyword: string;
};

type StatusCounts = Record<StatusValue, number>;

type EditorState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; roleId: number };

type SetStateAction<T> = T | ((prev: T) => T);

const noopRefresh = () => {};

const statusAtom = atom<StatusValue>('all');
const filterFormAtom = atom<FilterState>({ keyword: '' });
const appliedFiltersAtom = atom<FilterState>({ keyword: '' });
const paginationAtom = atom<PaginationState>({ ...DEFAULT_PAGINATION });
const selectedIdsAtom = atom<Set<number>>(new Set());
const statusCountsAtom = atom<StatusCounts>({
  all: 0,
  '0': 0,
  '1': 0,
});
const editorStateAtom = atom<EditorState>({ open: false });
const deleteTargetAtom = atom<Role | null>(null);
const bulkDeleteOpenAtom = atom(false);
const refreshingAtom = atom(false);
const activeMutationsAtom = atom(0);
const isMutatingAtom = atom((get) => get(activeMutationsAtom) > 0);
const refreshActionAtom = atom<{ current: () => void }>({
  current: noopRefresh,
});

const setStatusAtom = atom(
  null,
  (_get, set, value: StatusValue) => {
    set(statusAtom, value);
    set(paginationAtom, { ...DEFAULT_PAGINATION });
    set(selectedIdsAtom, new Set());
  },
);

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
  (
    get,
    set,
    payload: { filters: FilterState; force?: boolean },
  ) => {
    const { filters, force = false } = payload;
    const previous = get(appliedFiltersAtom);
    const hasChanged =
      force || previous.keyword !== filters.keyword;

    if (!hasChanged) {
      return;
    }

    set(appliedFiltersAtom, { ...filters });
    set(paginationAtom, { ...DEFAULT_PAGINATION });
    set(selectedIdsAtom, new Set());
  },
);

const resetFiltersAtom = atom(null, (_get, set) => {
  set(filterFormAtom, { keyword: '' });
  set(appliedFiltersAtom, { keyword: '' });
  set(paginationAtom, { ...DEFAULT_PAGINATION });
  set(selectedIdsAtom, new Set());
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

const setStatusCountsAtom = atom(
  null,
  (_get, set, counts: StatusCounts) => {
    set(statusCountsAtom, counts);
  },
);

const openCreateAtom = atom(null, (_get, set) => {
  set(editorStateAtom, { open: true, mode: 'create' });
});

const openEditAtom = atom(null, (_get, set, roleId: number) => {
  set(editorStateAtom, { open: true, mode: 'edit', roleId });
});

const closeEditorAtom = atom(null, (_get, set) => {
  set(editorStateAtom, { open: false });
});

const setDeleteTargetAtom = atom(
  null,
  (_get, set, role: Role | null) => {
    set(deleteTargetAtom, role);
  },
);

const setBulkDeleteOpenAtom = atom(
  null,
  (_get, set, open: boolean) => {
    set(bulkDeleteOpenAtom, open);
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

export interface RoleManagementStore {
  status: StatusValue;
  setStatus: (value: StatusValue) => void;
  filterForm: FilterState;
  setFilterForm: (action: SetStateAction<FilterState>) => void;
  appliedFilters: FilterState;
  applyFilters: (
    filters: FilterState,
    options?: { force?: boolean },
  ) => void;
  resetFilters: () => void;
  pagination: PaginationState;
  setPagination: (action: SetStateAction<PaginationState>) => void;
  selectedIds: Set<number>;
  setSelectedIds: (action: SetStateAction<Set<number>>) => void;
  clearSelectedIds: () => void;
  statusCounts: StatusCounts;
  setStatusCounts: (counts: StatusCounts) => void;
  editorState: EditorState;
  openCreate: () => void;
  openEdit: (roleId: number) => void;
  closeEditor: () => void;
  deleteTarget: Role | null;
  setDeleteTarget: (role: Role | null) => void;
  bulkDeleteOpen: boolean;
  setBulkDeleteOpen: (open: boolean) => void;
}

export const useRoleManagementStore = (): RoleManagementStore => {
  const status = useAtomValue(statusAtom);
  const filterForm = useAtomValue(filterFormAtom);
  const appliedFilters = useAtomValue(appliedFiltersAtom);
  const pagination = useAtomValue(paginationAtom);
  const selectedIds = useAtomValue(selectedIdsAtom);
  const statusCounts = useAtomValue(statusCountsAtom);
  const editorState = useAtomValue(editorStateAtom);
  const deleteTarget = useAtomValue(deleteTargetAtom);
  const bulkDeleteOpen = useAtomValue(bulkDeleteOpenAtom);

  const setStatus = useSetAtom(setStatusAtom);
  const setFilterForm = useSetAtom(setFilterFormAtom);
  const applyFiltersSetter = useSetAtom(applyFiltersAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const setPagination = useSetAtom(setPaginationAtom);
  const setSelectedIds = useSetAtom(setSelectedIdsAtom);
  const clearSelectedIds = useSetAtom(clearSelectedIdsAtom);
  const setStatusCounts = useSetAtom(setStatusCountsAtom);
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
    status,
    setStatus,
    filterForm,
    setFilterForm,
    appliedFilters,
    applyFilters,
    resetFilters,
    pagination,
    setPagination,
    selectedIds,
    setSelectedIds,
    clearSelectedIds,
    statusCounts,
    setStatusCounts,
    editorState,
    openCreate,
    openEdit,
    closeEditor,
    deleteTarget,
    setDeleteTarget,
    bulkDeleteOpen,
    setBulkDeleteOpen,
  };
};

export const useRoleManagementStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useRoleManagementRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useRoleManagementSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useRoleManagementMutationCounter = () => {
  const begin = useSetAtom(incrementMutationsAtom);
  const end = useSetAtom(decrementMutationsAtom);
  return {
    beginMutation: begin,
    endMutation: end,
  };
};

export const useRoleManagementSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);
