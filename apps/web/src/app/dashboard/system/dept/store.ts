'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import type { DepartmentNode } from './type';

export type StatusValue = 'all' | '0' | '1';

export type EditorState =
  | { open: false }
  | { open: true; mode: 'create'; parentId: number }
  | { open: true; mode: 'edit'; node: DepartmentNode };

export type DepartmentTreeUpdater =
  | DepartmentNode[]
  | ((prev: DepartmentNode[]) => DepartmentNode[]);

const noopRefresh = () => {};

const statusAtom = atom<StatusValue>('all');
const keywordAtom = atom<string>('');
const treeAtom = atom<DepartmentNode[]>([]);
const editorStateAtom = atom<EditorState>({ open: false });
const deleteTargetAtom = atom<DepartmentNode | null>(null);
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
  },
);

type SetStateAction<T> = T | ((prev: T) => T);

const setKeywordAtom = atom(
  null,
  (get, set, value: SetStateAction<string>) => {
    const current = get(keywordAtom);
    const next =
      typeof value === 'function'
        ? (value as (prev: string) => string)(current)
        : value;
    set(keywordAtom, next);
  },
);

const setTreeAtom = atom(
  null,
  (get, set, updater: DepartmentTreeUpdater) => {
    if (typeof updater === 'function') {
      const next = updater(get(treeAtom));
      set(treeAtom, next);
      return;
    }
    set(treeAtom, updater);
  },
);

const openCreateAtom = atom(
  null,
  (_get, set, parentId: number) => {
    set(editorStateAtom, { open: true, mode: 'create', parentId });
  },
);

const openEditAtom = atom(
  null,
  (_get, set, node: DepartmentNode) => {
    set(editorStateAtom, { open: true, mode: 'edit', node });
  },
);

const closeEditorAtom = atom(null, (_get, set) => {
  set(editorStateAtom, { open: false });
});

const setDeleteTargetAtom = atom(
  null,
  (_get, set, node: DepartmentNode | null) => {
    set(deleteTargetAtom, node);
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

export interface DepartmentManagementStore {
  status: StatusValue;
  setStatus: (value: StatusValue) => void;
  keyword: string;
  setKeyword: (value: string) => void;
  departmentTree: DepartmentNode[];
  setDepartmentTree: (updater: DepartmentTreeUpdater) => void;
  editorState: EditorState;
  openCreate: (parentId: number) => void;
  openEdit: (node: DepartmentNode) => void;
  closeEditor: () => void;
  deleteTarget: DepartmentNode | null;
  setDeleteTarget: (node: DepartmentNode | null) => void;
}

export const useDepartmentManagementStore =
  (): DepartmentManagementStore => {
    const status = useAtomValue(statusAtom);
    const keyword = useAtomValue(keywordAtom);
    const tree = useAtomValue(treeAtom);
    const editorState = useAtomValue(editorStateAtom);
    const deleteTarget = useAtomValue(deleteTargetAtom);

    const setStatus = useSetAtom(setStatusAtom);
    const setKeyword = useSetAtom(setKeywordAtom);
    const setTree = useSetAtom(setTreeAtom);
    const openCreate = useSetAtom(openCreateAtom);
    const openEdit = useSetAtom(openEditAtom);
    const closeEditor = useSetAtom(closeEditorAtom);
    const setDeleteTarget = useSetAtom(setDeleteTargetAtom);

    return {
      status,
      setStatus,
      keyword,
      setKeyword,
      departmentTree: tree,
      setDepartmentTree: setTree,
      editorState,
      openCreate,
      openEdit,
      closeEditor,
      deleteTarget,
      setDeleteTarget,
    };
  };

export const useDepartmentManagementStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useDepartmentManagementRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useDepartmentManagementSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useDepartmentManagementMutationCounter = () => {
  const begin = useSetAtom(incrementMutationsAtom);
  const end = useSetAtom(decrementMutationsAtom);
  return {
    beginMutation: begin,
    endMutation: end,
  };
};

export const useDepartmentManagementSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);
