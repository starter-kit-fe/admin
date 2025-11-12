'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import {
  DEFAULT_CACHE_LIST_FILTERS,
  DEFAULT_CACHE_LIST_PAGINATION,
} from './constants';

export type CacheListFilterState = {
  pattern: string;
};

type PaginationState = {
  pageNum: number;
  pageSize: number;
};

type SetStateAction<T> = T | ((prev: T) => T);

const noopRefresh = () => {};

const filterFormAtom = atom<CacheListFilterState>({
  ...DEFAULT_CACHE_LIST_FILTERS,
});
const appliedFiltersAtom = atom<CacheListFilterState>({
  ...DEFAULT_CACHE_LIST_FILTERS,
});
const paginationAtom = atom<PaginationState>({
  ...DEFAULT_CACHE_LIST_PAGINATION,
});
const refreshingAtom = atom(false);
const activeMutationsAtom = atom(0);
const isMutatingAtom = atom((get) => get(activeMutationsAtom) > 0);
const refreshActionAtom = atom<{ current: () => void }>({
  current: noopRefresh,
});

const setFilterFormAtom = atom(
  null,
  (get, set, action: SetStateAction<CacheListFilterState>) => {
    const current = get(filterFormAtom);
    const next =
      typeof action === 'function'
        ? (action as (prev: CacheListFilterState) => CacheListFilterState)(
            current,
          )
        : action;
    set(filterFormAtom, { ...next });
  },
);

const applyFiltersAtom = atom(
  null,
  (
    get,
    set,
    payload: { filters: CacheListFilterState; force?: boolean },
  ) => {
    const { filters, force = false } = payload;
    const previous = get(appliedFiltersAtom);
    const hasChanged = force || previous.pattern !== filters.pattern;

    if (!hasChanged) {
      return;
    }

    set(appliedFiltersAtom, { ...filters });
    set(paginationAtom, { ...DEFAULT_CACHE_LIST_PAGINATION });
  },
);

const resetFiltersAtom = atom(null, (_get, set) => {
  set(filterFormAtom, { ...DEFAULT_CACHE_LIST_FILTERS });
  set(appliedFiltersAtom, { ...DEFAULT_CACHE_LIST_FILTERS });
  set(paginationAtom, { ...DEFAULT_CACHE_LIST_PAGINATION });
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

export interface CacheListManagementStore {
  filterForm: CacheListFilterState;
  setFilterForm: (action: SetStateAction<CacheListFilterState>) => void;
  appliedFilters: CacheListFilterState;
  applyFilters: (
    filters: CacheListFilterState,
    options?: { force?: boolean },
  ) => void;
  resetFilters: () => void;
  pagination: PaginationState;
  setPagination: (action: SetStateAction<PaginationState>) => void;
}

export const useCacheListManagementStore =
  (): CacheListManagementStore => {
    const filterForm = useAtomValue(filterFormAtom);
    const appliedFilters = useAtomValue(appliedFiltersAtom);
    const pagination = useAtomValue(paginationAtom);

    const setFilterForm = useSetAtom(setFilterFormAtom);
    const applyFiltersSetter = useSetAtom(applyFiltersAtom);
    const resetFilters = useSetAtom(resetFiltersAtom);
    const setPagination = useSetAtom(setPaginationAtom);

    const applyFilters = (
      filters: CacheListFilterState,
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
    };
  };

export const useCacheListStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useCacheListSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useCacheListMutationCounter = () => {
  const beginMutation = useSetAtom(incrementMutationsAtom);
  const endMutation = useSetAtom(decrementMutationsAtom);
  return { beginMutation, endMutation };
};

export const useCacheListRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useCacheListSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);
