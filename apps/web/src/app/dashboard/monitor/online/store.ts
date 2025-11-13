'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import { DEFAULT_FILTERS, DEFAULT_PAGINATION } from './constants';
import type { TimeRangeValue } from './constants';
import type { OnlineUser } from './type';

export type FilterFormState = {
  userName: string;
  ipaddr: string;
  timeRange: TimeRangeValue;
};

type PaginationState = {
  pageNum: number;
  pageSize: number;
};

type ForceDialogState =
  | { open: false }
  | {
      open: true;
      user: OnlineUser;
    };

type DetailDialogState =
  | { open: false }
  | {
      open: true;
      user: OnlineUser;
    };

type SetStateAction<T> = T | ((prev: T) => T);

const noopRefresh = () => {};

const filterFormAtom = atom<FilterFormState>({ ...DEFAULT_FILTERS });
const appliedFiltersAtom = atom<FilterFormState>({ ...DEFAULT_FILTERS });
const paginationAtom = atom<PaginationState>({ ...DEFAULT_PAGINATION });
const selectedUsersAtom = atom<OnlineUser[]>([]);
const selectionRevisionAtom = atom(0);
const forceDialogAtom = atom<ForceDialogState>({ open: false });
const detailDialogAtom = atom<DetailDialogState>({ open: false });
const batchDialogOpenAtom = atom(false);
const refreshingAtom = atom(false);
const activeMutationsAtom = atom(0);
const isMutatingAtom = atom((get) => get(activeMutationsAtom) > 0);
const refreshActionAtom = atom<{ current: () => void }>({
  current: noopRefresh,
});
const pendingForceRowIdAtom = atom<string | null>(null);

const setFilterFormAtom = atom(
  null,
  (get, set, action: SetStateAction<FilterFormState>) => {
    const current = get(filterFormAtom);
    const next =
      typeof action === 'function'
        ? (action as (prev: FilterFormState) => FilterFormState)(current)
        : action;
    set(filterFormAtom, { ...next });
  },
);

const applyFiltersAtom = atom(
  null,
  (
    get,
    set,
    payload: { filters: FilterFormState; force?: boolean },
  ) => {
    const { filters, force = false } = payload;
    const previous = get(appliedFiltersAtom);
    const hasChanged =
      force ||
      previous.userName !== filters.userName ||
      previous.ipaddr !== filters.ipaddr ||
      previous.timeRange !== filters.timeRange;

    if (!hasChanged) {
      return;
    }

    set(appliedFiltersAtom, { ...filters });
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

const setSelectedUsersAtom = atom(
  null,
  (_get, set, users: OnlineUser[]) => {
    set(selectedUsersAtom, [...users]);
  },
);

const clearSelectedUsersAtom = atom(null, (_get, set) => {
  set(selectedUsersAtom, []);
  set(selectionRevisionAtom, (prev) => prev + 1);
});

const openForceDialogAtom = atom(null, (_get, set, user: OnlineUser) => {
  set(forceDialogAtom, { open: true, user });
});

const closeForceDialogAtom = atom(null, (_get, set) => {
  set(forceDialogAtom, { open: false });
});

const openDetailDialogAtom = atom(null, (_get, set, user: OnlineUser) => {
  set(detailDialogAtom, { open: true, user });
});

const closeDetailDialogAtom = atom(null, (_get, set) => {
  set(detailDialogAtom, { open: false });
});

const setBatchDialogAtom = atom(
  null,
  (_get, set, open: boolean) => {
    set(batchDialogOpenAtom, open);
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

const setPendingForceRowIdAtom = atom(
  null,
  (_get, set, rowId: string | null) => {
    set(pendingForceRowIdAtom, rowId);
  },
);

export interface OnlineUserManagementStore {
  filterForm: FilterFormState;
  setFilterForm: (action: SetStateAction<FilterFormState>) => void;
  appliedFilters: FilterFormState;
  applyFilters: (
    filters: FilterFormState,
    options?: { force?: boolean },
  ) => void;
  resetFilters: () => void;
  pagination: PaginationState;
  setPagination: (action: SetStateAction<PaginationState>) => void;
  selectedUsers: OnlineUser[];
  setSelectedUsers: (users: OnlineUser[]) => void;
  clearSelectedUsers: () => void;
  forceDialog: ForceDialogState;
  openForceDialog: (user: OnlineUser) => void;
  closeForceDialog: () => void;
  detailDialog: DetailDialogState;
  openDetailDialog: (user: OnlineUser) => void;
  closeDetailDialog: () => void;
  batchDialogOpen: boolean;
  setBatchDialogOpen: (open: boolean) => void;
  pendingForceRowId: string | null;
  setPendingForceRowId: (rowId: string | null) => void;
}

export const useOnlineUserManagementStore =
  (): OnlineUserManagementStore => {
    const filterForm = useAtomValue(filterFormAtom);
    const appliedFilters = useAtomValue(appliedFiltersAtom);
    const pagination = useAtomValue(paginationAtom);
    const selectedUsers = useAtomValue(selectedUsersAtom);
    const forceDialog = useAtomValue(forceDialogAtom);
    const detailDialog = useAtomValue(detailDialogAtom);
    const batchDialogOpen = useAtomValue(batchDialogOpenAtom);
    const pendingForceRowId = useAtomValue(pendingForceRowIdAtom);

    const setFilterForm = useSetAtom(setFilterFormAtom);
    const applyFiltersSetter = useSetAtom(applyFiltersAtom);
    const resetFilters = useSetAtom(resetFiltersAtom);
    const setPagination = useSetAtom(setPaginationAtom);
    const setSelectedUsers = useSetAtom(setSelectedUsersAtom);
    const clearSelectedUsers = useSetAtom(clearSelectedUsersAtom);
    const openForceDialog = useSetAtom(openForceDialogAtom);
    const closeForceDialog = useSetAtom(closeForceDialogAtom);
    const openDetailDialog = useSetAtom(openDetailDialogAtom);
    const closeDetailDialog = useSetAtom(closeDetailDialogAtom);
    const setBatchDialogOpen = useSetAtom(setBatchDialogAtom);
    const setPendingForceRowId = useSetAtom(setPendingForceRowIdAtom);

    const applyFilters = (
      filters: FilterFormState,
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
      selectedUsers,
      setSelectedUsers,
      clearSelectedUsers,
      forceDialog,
      openForceDialog,
      closeForceDialog,
      detailDialog,
      openDetailDialog,
      closeDetailDialog,
      batchDialogOpen,
      setBatchDialogOpen,
      pendingForceRowId,
      setPendingForceRowId,
    };
  };

export const useOnlineUserManagementStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useOnlineUserManagementRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useOnlineUserManagementSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useOnlineUserManagementMutationCounter = () => {
  const begin = useSetAtom(incrementMutationsAtom);
  const end = useSetAtom(decrementMutationsAtom);
  return {
    beginMutation: begin,
    endMutation: end,
  };
};

export const useOnlineUserManagementSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);

export const useOnlineUserManagementSelectionRevision = () =>
  useAtomValue(selectionRevisionAtom);
