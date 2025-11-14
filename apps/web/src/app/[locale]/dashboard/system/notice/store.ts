'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import {
  NOTICE_STATUS_TABS,
  NOTICE_TYPE_OPTIONS,
} from './constants';
import type { Notice } from './type';

export type NoticeStatusValue = (typeof NOTICE_STATUS_TABS)[number]['value'];
export type NoticeTypeValue = (typeof NOTICE_TYPE_OPTIONS)[number]['value'];

type FilterState = {
  noticeTitle: string;
};

type EditorState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; notice: Notice };

type SetStateAction<T> = T | ((prev: T) => T);

const noopRefresh = () => {};

const statusAtom = atom<NoticeStatusValue>('all');
const noticeTypeAtom = atom<NoticeTypeValue>('all');
const filterFormAtom = atom<FilterState>({ noticeTitle: '' });
const appliedFiltersAtom = atom<FilterState>({ noticeTitle: '' });

const noticesAtom = atom<Notice[]>([]);
const selectedIdsAtom = atom<Set<number>>(new Set<number>());

const editorStateAtom = atom<EditorState>({ open: false });
const deleteTargetAtom = atom<Notice | null>(null);
const bulkDeleteOpenAtom = atom(false);

const refreshingAtom = atom(false);
const activeMutationsAtom = atom(0);
const isMutatingAtom = atom((get) => get(activeMutationsAtom) > 0);
const refreshActionAtom = atom<{ current: () => void }>({
  current: noopRefresh,
});

const setStatusAtom = atom(null, (_get, set, value: NoticeStatusValue) => {
  set(statusAtom, value);
  set(selectedIdsAtom, new Set<number>());
});

const setNoticeTypeAtom = atom(
  null,
  (_get, set, value: NoticeTypeValue) => {
    set(noticeTypeAtom, value);
    set(selectedIdsAtom, new Set<number>());
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
      force || previous.noticeTitle !== filters.noticeTitle;
    if (!hasChanged) {
      return;
    }
    set(appliedFiltersAtom, { ...filters });
    set(selectedIdsAtom, new Set<number>());
  },
);

const resetFiltersAtom = atom(null, (_get, set) => {
  set(filterFormAtom, { noticeTitle: '' });
  set(appliedFiltersAtom, { noticeTitle: '' });
  set(selectedIdsAtom, new Set<number>());
});

const setNoticesAtom = atom(
  null,
  (_get, set, notices: Notice[]) => {
    set(noticesAtom, notices);
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
    const next: Set<number> =
      resolved instanceof Set
        ? resolved
        : new Set<number>(resolved as Iterable<number>);
    let changed = next.size !== current.size;
    if (!changed) {
      next.forEach((id: number) => {
        if (!current.has(id)) {
          changed = true;
        }
      });
    }
    if (!changed) {
      return;
    }
    set(selectedIdsAtom, new Set(next));
  },
);

const clearSelectedIdsAtom = atom(null, (get, set) => {
  if (get(selectedIdsAtom).size === 0) {
    return;
  }
  set(selectedIdsAtom, new Set<number>());
});

const openCreateAtom = atom(null, (_get, set) => {
  set(editorStateAtom, { open: true, mode: 'create' });
});

const openEditAtom = atom(null, (_get, set, notice: Notice) => {
  set(editorStateAtom, { open: true, mode: 'edit', notice });
});

const closeEditorAtom = atom(null, (_get, set) => {
  set(editorStateAtom, { open: false });
});

const setDeleteTargetAtom = atom(
  null,
  (_get, set, notice: Notice | null) => {
    set(deleteTargetAtom, notice);
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

export interface NoticeManagementStore {
  status: NoticeStatusValue;
  setStatus: (value: NoticeStatusValue) => void;
  noticeType: NoticeTypeValue;
  setNoticeType: (value: NoticeTypeValue) => void;
  filterForm: FilterState;
  setFilterForm: (action: SetStateAction<FilterState>) => void;
  appliedFilters: FilterState;
  applyFilters: (
    filters: FilterState,
    options?: { force?: boolean },
  ) => void;
  resetFilters: () => void;
  notices: Notice[];
  setNotices: (notices: Notice[]) => void;
  selectedIds: Set<number>;
  setSelectedIds: (action: SetStateAction<Set<number>>) => void;
  clearSelectedIds: () => void;
  editorState: EditorState;
  openCreate: () => void;
  openEdit: (notice: Notice) => void;
  closeEditor: () => void;
  deleteTarget: Notice | null;
  setDeleteTarget: (notice: Notice | null) => void;
  bulkDeleteOpen: boolean;
  setBulkDeleteOpen: (open: boolean) => void;
}

export const useNoticeManagementStore = (): NoticeManagementStore => {
  const status = useAtomValue(statusAtom);
  const noticeType = useAtomValue(noticeTypeAtom);
  const filterForm = useAtomValue(filterFormAtom);
  const appliedFilters = useAtomValue(appliedFiltersAtom);
  const notices = useAtomValue(noticesAtom);
  const selectedIds = useAtomValue(selectedIdsAtom);
  const editorState = useAtomValue(editorStateAtom);
  const deleteTarget = useAtomValue(deleteTargetAtom);
  const bulkDeleteOpen = useAtomValue(bulkDeleteOpenAtom);

  const setStatus = useSetAtom(setStatusAtom);
  const setNoticeType = useSetAtom(setNoticeTypeAtom);
  const setFilterForm = useSetAtom(setFilterFormAtom);
  const applyFiltersSetter = useSetAtom(applyFiltersAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const setNotices = useSetAtom(setNoticesAtom);
  const setSelectedIds = useSetAtom(setSelectedIdsAtom);
  const clearSelectedIds = useSetAtom(clearSelectedIdsAtom);
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
    noticeType,
    setNoticeType,
    filterForm,
    setFilterForm,
    appliedFilters,
    applyFilters,
    resetFilters,
    notices,
    setNotices,
    selectedIds,
    setSelectedIds,
    clearSelectedIds,
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

export const useNoticeManagementStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useNoticeManagementRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useNoticeManagementSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useNoticeManagementMutationCounter = () => {
  const begin = useSetAtom(incrementMutationsAtom);
  const end = useSetAtom(decrementMutationsAtom);
  return {
    beginMutation: begin,
    endMutation: end,
  };
};

export const useNoticeManagementSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);
