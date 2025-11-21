'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import {
  DEFAULT_LOGIN_LOG_PAGINATION,
  LOGIN_LOG_STATUS_TABS,
} from './constants';
import type { LoginLog } from './type';

export type LoginLogStatusValue =
  (typeof LOGIN_LOG_STATUS_TABS)[number]['value'];

type FilterState = {
  userName: string;
  ipaddr: string;
};

type PaginationState = {
  pageNum: number;
  pageSize: number;
};

type SetStateAction<T> = T | ((prev: T) => T);

const noopRefresh = () => {};

const statusAtom = atom<LoginLogStatusValue>('all');
const filterFormAtom = atom<FilterState>({ userName: '', ipaddr: '' });
const appliedFiltersAtom = atom<FilterState>({ userName: '', ipaddr: '' });
const paginationAtom = atom<PaginationState>({
  ...DEFAULT_LOGIN_LOG_PAGINATION,
});
const logsAtom = atom<LoginLog[]>([]);
const totalAtom = atom(0);
const deleteTargetAtom = atom<LoginLog | null>(null);

const refreshingAtom = atom(false);
const activeMutationsAtom = atom(0);
const isMutatingAtom = atom((get) => get(activeMutationsAtom) > 0);
const refreshActionAtom = atom<{ current: () => void }>({
  current: noopRefresh,
});

const setStatusAtom = atom(
  null,
  (_get, set, value: LoginLogStatusValue) => {
    set(statusAtom, value);
    set(paginationAtom, { ...DEFAULT_LOGIN_LOG_PAGINATION });
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
    const previous = get(appliedFiltersAtom);
    const hasChanges =
      payload.force ||
      previous.userName !== payload.filters.userName ||
      previous.ipaddr !== payload.filters.ipaddr;

    if (!hasChanges) {
      return;
    }

    set(appliedFiltersAtom, { ...payload.filters });
    set(paginationAtom, { ...DEFAULT_LOGIN_LOG_PAGINATION });
  },
);

const resetFiltersAtom = atom(null, (_get, set) => {
  set(statusAtom, 'all');
  set(filterFormAtom, { userName: '', ipaddr: '' });
  set(appliedFiltersAtom, { userName: '', ipaddr: '' });
  set(paginationAtom, { ...DEFAULT_LOGIN_LOG_PAGINATION });
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

const setLogsAtom = atom(
  null,
  (_get, set, logs: LoginLog[]) => {
    set(logsAtom, logs);
  },
);

const setTotalAtom = atom(
  null,
  (_get, set, total: number) => {
    set(totalAtom, total);
  },
);

const setDeleteTargetAtom = atom(
  null,
  (_get, set, log: LoginLog | null) => {
    set(deleteTargetAtom, log);
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

export interface LoginLogManagementStore {
  status: LoginLogStatusValue;
  setStatus: (value: LoginLogStatusValue) => void;
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
  logs: LoginLog[];
  setLogs: (logs: LoginLog[]) => void;
  total: number;
  setTotal: (total: number) => void;
  deleteTarget: LoginLog | null;
  setDeleteTarget: (log: LoginLog | null) => void;
}

export const useLoginLogManagementStore =
  (): LoginLogManagementStore => {
    const status = useAtomValue(statusAtom);
    const filterForm = useAtomValue(filterFormAtom);
    const appliedFilters = useAtomValue(appliedFiltersAtom);
    const pagination = useAtomValue(paginationAtom);
    const logs = useAtomValue(logsAtom);
    const total = useAtomValue(totalAtom);
    const deleteTarget = useAtomValue(deleteTargetAtom);

    const setStatus = useSetAtom(setStatusAtom);
    const setFilterForm = useSetAtom(setFilterFormAtom);
    const applyFiltersSetter = useSetAtom(applyFiltersAtom);
    const resetFilters = useSetAtom(resetFiltersAtom);
    const setPagination = useSetAtom(setPaginationAtom);
    const setLogs = useSetAtom(setLogsAtom);
    const setTotal = useSetAtom(setTotalAtom);
    const setDeleteTarget = useSetAtom(setDeleteTargetAtom);

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
      logs,
      setLogs,
      total,
      setTotal,
      deleteTarget,
      setDeleteTarget,
    };
  };

export const useLoginLogManagementStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useLoginLogManagementRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useLoginLogManagementSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useLoginLogManagementMutationCounter = () => {
  const begin = useSetAtom(incrementMutationsAtom);
  const end = useSetAtom(decrementMutationsAtom);
  return {
    beginMutation: begin,
    endMutation: end,
  };
};

export const useLoginLogManagementSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);
