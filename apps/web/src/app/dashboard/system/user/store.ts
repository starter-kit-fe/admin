'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import type { FiltersFormState, RoleOption } from './components/filters-bar';
import { DEFAULT_ROLE_VALUE } from './components/utils';
import { DEFAULT_PAGINATION, STATUS_TABS } from './constants';
import type { User } from './type';

export type StatusValue = (typeof STATUS_TABS)[number]['value'];

type PaginationState = {
  pageNum: number;
  pageSize: number;
};

type StatusCounts = Record<StatusValue, number>;

type EditorState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; user: User };

type SetStateAction<T> = T | ((prev: T) => T);

const noopRefresh = () => {};

const defaultFilters: FiltersFormState = {
  role: DEFAULT_ROLE_VALUE,
  keyword: '',
};

const statusAtom = atom<StatusValue>('all');
const filterFormAtom = atom<FiltersFormState>(defaultFilters);
const appliedFiltersAtom = atom<FiltersFormState>(defaultFilters);
const paginationAtom = atom<PaginationState>({ ...DEFAULT_PAGINATION });
const selectedIdsAtom = atom<Set<number>>(new Set<number>());
const roleOptionsAtom = atom<RoleOption[]>([
  { label: '全部角色', value: DEFAULT_ROLE_VALUE },
]);
const statusCountsAtom = atom<StatusCounts>({
  all: 0,
  '0': 0,
  '1': 0,
});
const editorStateAtom = atom<EditorState>({ open: false });
const deleteTargetAtom = atom<User | null>(null);
const bulkDeleteOpenAtom = atom(false);
const refreshingAtom = atom(false);
const activeMutationsAtom = atom(0);
const isMutatingAtom = atom((get) => get(activeMutationsAtom) > 0);
const refreshActionAtom = atom<{ current: () => void }>({
  current: noopRefresh,
});

const setStatusAtom = atom(null, (_get, set, value: StatusValue) => {
  set(statusAtom, value);
  set(paginationAtom, { ...DEFAULT_PAGINATION });
  set(selectedIdsAtom, new Set());
});

const setFilterFormAtom = atom(
  null,
  (get, set, action: SetStateAction<FiltersFormState>) => {
    const current = get(filterFormAtom);
    const next =
      typeof action === 'function'
        ? (action as (prev: FiltersFormState) => FiltersFormState)(current)
        : action;
    set(filterFormAtom, { ...next });
  },
);

const applyFiltersAtom = atom(
  null,
  (
    get,
    set,
    payload: { filters: FiltersFormState; force?: boolean },
  ) => {
    const { filters, force = false } = payload;
    const previous = get(appliedFiltersAtom);
    const hasChanged =
      force ||
      previous.role !== filters.role ||
      previous.keyword !== filters.keyword;

    if (!hasChanged) {
      return;
    }

    set(appliedFiltersAtom, { ...filters });
    set(paginationAtom, { ...DEFAULT_PAGINATION });
    set(selectedIdsAtom, new Set<number>());
  },
);

const resetFiltersAtom = atom(null, (_get, set) => {
  set(filterFormAtom, { ...defaultFilters });
  set(appliedFiltersAtom, { ...defaultFilters });
  set(paginationAtom, { ...DEFAULT_PAGINATION });
  set(selectedIdsAtom, new Set<number>());
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

const resetPaginationAtom = atom(null, (_get, set) => {
  set(paginationAtom, { ...DEFAULT_PAGINATION });
});

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
  set(selectedIdsAtom, new Set<number>());
});

const setRoleOptionsAtom = atom(
  null,
  (_get, set, options: RoleOption[]) => {
    set(roleOptionsAtom, options);
  },
);

const setStatusCountsAtom = atom(
  null,
  (_get, set, counts: StatusCounts) => {
    set(statusCountsAtom, counts);
  },
);

const openCreateAtom = atom(null, (_get, set) => {
  set(editorStateAtom, { open: true, mode: 'create' });
});

const openEditAtom = atom(null, (_get, set, user: User) => {
  set(editorStateAtom, { open: true, mode: 'edit', user });
});

const closeEditorAtom = atom(null, (_get, set) => {
  set(editorStateAtom, { open: false });
});

const setDeleteTargetAtom = atom(
  null,
  (_get, set, user: User | null) => {
    set(deleteTargetAtom, user);
  },
);

const setBulkDeleteOpenAtom = atom(
  null,
  (_get, set, open: boolean) => {
    set(bulkDeleteOpenAtom, open);
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

export interface UserManagementStore {
  status: StatusValue;
  setStatus: (value: StatusValue) => void;
  filterForm: FiltersFormState;
  setFilterForm: (action: SetStateAction<FiltersFormState>) => void;
  appliedFilters: FiltersFormState;
  applyFilters: (
    filters: FiltersFormState,
    options?: { force?: boolean },
  ) => void;
  resetFilters: () => void;
  pagination: PaginationState;
  setPagination: (action: SetStateAction<PaginationState>) => void;
  resetPagination: () => void;
  selectedIds: Set<number>;
  setSelectedIds: (action: SetStateAction<Set<number>>) => void;
  clearSelectedIds: () => void;
  roleOptions: RoleOption[];
  setRoleOptions: (options: RoleOption[]) => void;
  statusCounts: StatusCounts;
  setStatusCounts: (counts: StatusCounts) => void;
  editorState: EditorState;
  openCreate: () => void;
  openEdit: (user: User) => void;
  closeEditor: () => void;
  deleteTarget: User | null;
  setDeleteTarget: (user: User | null) => void;
  bulkDeleteOpen: boolean;
  setBulkDeleteOpen: (open: boolean) => void;
}

export const useUserManagementStore = (): UserManagementStore => {
  const status = useAtomValue(statusAtom);
  const filterForm = useAtomValue(filterFormAtom);
  const appliedFilters = useAtomValue(appliedFiltersAtom);
  const pagination = useAtomValue(paginationAtom);
  const selectedIds = useAtomValue(selectedIdsAtom);
  const roleOptions = useAtomValue(roleOptionsAtom);
  const statusCounts = useAtomValue(statusCountsAtom);
  const editorState = useAtomValue(editorStateAtom);
  const deleteTarget = useAtomValue(deleteTargetAtom);
  const bulkDeleteOpen = useAtomValue(bulkDeleteOpenAtom);

  const setStatus = useSetAtom(setStatusAtom);
  const setFilterForm = useSetAtom(setFilterFormAtom);
  const applyFiltersSetter = useSetAtom(applyFiltersAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const setPagination = useSetAtom(setPaginationAtom);
  const resetPagination = useSetAtom(resetPaginationAtom);
  const setSelectedIds = useSetAtom(setSelectedIdsAtom);
  const clearSelectedIds = useSetAtom(clearSelectedIdsAtom);
  const setRoleOptions = useSetAtom(setRoleOptionsAtom);
  const setStatusCounts = useSetAtom(setStatusCountsAtom);
  const openCreate = useSetAtom(openCreateAtom);
  const openEdit = useSetAtom(openEditAtom);
  const closeEditor = useSetAtom(closeEditorAtom);
  const setDeleteTarget = useSetAtom(setDeleteTargetAtom);
  const setBulkDeleteOpen = useSetAtom(setBulkDeleteOpenAtom);

  const applyFilters = (
    filters: FiltersFormState,
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
    resetPagination,
    selectedIds,
    setSelectedIds,
    clearSelectedIds,
    roleOptions,
    setRoleOptions,
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

export const useUserManagementStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useUserManagementRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useUserManagementSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useUserManagementMutationCounter = () => {
  const begin = useSetAtom(incrementMutationsAtom);
  const end = useSetAtom(decrementMutationsAtom);
  return {
    beginMutation: begin,
    endMutation: end,
  };
};

export const useUserManagementSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);
