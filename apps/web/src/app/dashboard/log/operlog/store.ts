'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import {
  DEFAULT_OPER_LOG_PAGINATION,
  OPER_LOG_BUSINESS_TYPE_OPTIONS,
  OPER_LOG_REQUEST_METHOD_OPTIONS,
  OPER_LOG_STATUS_OPTIONS,
} from './constants';
import type { OperLog } from './type';

export type OperLogStatusValue =
  (typeof OPER_LOG_STATUS_OPTIONS)[number]['value'];
export type OperLogBusinessTypeValue =
  (typeof OPER_LOG_BUSINESS_TYPE_OPTIONS)[number]['value'];
export type OperLogRequestMethodValue =
  (typeof OPER_LOG_REQUEST_METHOD_OPTIONS)[number]['value'];

export type OperLogFilterState = {
  title: string;
  operName: string;
  businessType: OperLogBusinessTypeValue;
  status: OperLogStatusValue;
  requestMethod: OperLogRequestMethodValue;
};

type PaginationState = {
  pageNum: number;
  pageSize: number;
};

type SetStateAction<T> = T | ((prev: T) => T);

const noopRefresh = () => {};

const defaultFilterState: OperLogFilterState = {
  title: '',
  operName: '',
  businessType: 'all',
  status: 'all',
  requestMethod: 'all',
};

const filterFormAtom = atom<OperLogFilterState>({ ...defaultFilterState });
const appliedFiltersAtom = atom<OperLogFilterState>({
  ...defaultFilterState,
});
const paginationAtom = atom<PaginationState>({
  ...DEFAULT_OPER_LOG_PAGINATION,
});
const logsAtom = atom<OperLog[]>([]);
const totalAtom = atom(0);
const deleteTargetAtom = atom<OperLog | null>(null);

const refreshingAtom = atom(false);
const activeMutationsAtom = atom(0);
const isMutatingAtom = atom((get) => get(activeMutationsAtom) > 0);
const refreshActionAtom = atom<{ current: () => void }>({
  current: noopRefresh,
});

const setFilterFormAtom = atom(
  null,
  (get, set, action: SetStateAction<OperLogFilterState>) => {
    const current = get(filterFormAtom);
    const next =
      typeof action === 'function'
        ? (action as (prev: OperLogFilterState) => OperLogFilterState)(current)
        : action;
    set(filterFormAtom, { ...next });
  },
);

const applyFiltersAtom = atom(
  null,
  (
    get,
    set,
    payload: { filters: OperLogFilterState; force?: boolean },
  ) => {
    const previous = get(appliedFiltersAtom);
    const hasChanges =
      payload.force ||
      previous.title !== payload.filters.title ||
      previous.operName !== payload.filters.operName ||
      previous.businessType !== payload.filters.businessType ||
      previous.status !== payload.filters.status ||
      previous.requestMethod !== payload.filters.requestMethod;

    if (!hasChanges) {
      return;
    }

    set(appliedFiltersAtom, { ...payload.filters });
    set(paginationAtom, { ...DEFAULT_OPER_LOG_PAGINATION });
  },
);

const resetFiltersAtom = atom(null, (_get, set) => {
  set(filterFormAtom, { ...defaultFilterState });
  set(appliedFiltersAtom, { ...defaultFilterState });
  set(paginationAtom, { ...DEFAULT_OPER_LOG_PAGINATION });
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
  (_get, set, logs: OperLog[]) => {
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
  (_get, set, log: OperLog | null) => {
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

export interface OperLogManagementStore {
  filterForm: OperLogFilterState;
  setFilterForm: (action: SetStateAction<OperLogFilterState>) => void;
  appliedFilters: OperLogFilterState;
  applyFilters: (
    filters: OperLogFilterState,
    options?: { force?: boolean },
  ) => void;
  resetFilters: () => void;
  pagination: PaginationState;
  setPagination: (action: SetStateAction<PaginationState>) => void;
  logs: OperLog[];
  setLogs: (logs: OperLog[]) => void;
  total: number;
  setTotal: (total: number) => void;
  deleteTarget: OperLog | null;
  setDeleteTarget: (log: OperLog | null) => void;
}

export const useOperLogManagementStore = (): OperLogManagementStore => {
  const filterForm = useAtomValue(filterFormAtom);
  const appliedFilters = useAtomValue(appliedFiltersAtom);
  const pagination = useAtomValue(paginationAtom);
  const logs = useAtomValue(logsAtom);
  const total = useAtomValue(totalAtom);
  const deleteTarget = useAtomValue(deleteTargetAtom);

  const setFilterForm = useSetAtom(setFilterFormAtom);
  const applyFiltersSetter = useSetAtom(applyFiltersAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const setPagination = useSetAtom(setPaginationAtom);
  const setLogs = useSetAtom(setLogsAtom);
  const setTotal = useSetAtom(setTotalAtom);
  const setDeleteTarget = useSetAtom(setDeleteTargetAtom);

  const applyFilters = (
    filters: OperLogFilterState,
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
    logs,
    setLogs,
    total,
    setTotal,
    deleteTarget,
    setDeleteTarget,
  };
};

export const useOperLogManagementStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useOperLogManagementRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useOperLogManagementSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useOperLogManagementMutationCounter = () => {
  const begin = useSetAtom(incrementMutationsAtom);
  const end = useSetAtom(decrementMutationsAtom);
  return {
    beginMutation: begin,
    endMutation: end,
  };
};

export const useOperLogManagementSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);
