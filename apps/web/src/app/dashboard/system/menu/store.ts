'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';

import type { MenuTreeNode } from './type';

export type StatusValue = 'all' | '0' | '1';

export type EditorState =
  | { open: false }
  | { open: true; mode: 'create'; parentId: number }
  | { open: true; mode: 'edit'; menu: MenuTreeNode };

export type MenuTreeUpdater =
  | MenuTreeNode[]
  | ((prev: MenuTreeNode[]) => MenuTreeNode[]);

const noopRefresh = () => {};

const statusAtom = atom<StatusValue>('all');
const keywordAtom = atom<string>('');
const menuTreeAtom = atom<MenuTreeNode[]>([]);
const editorStateAtom = atom<EditorState>({ open: false });
const deleteTargetAtom = atom<MenuTreeNode | null>(null);
const refreshingAtom = atom(false);
const activeMutationsAtom = atom(0);
const isMutatingAtom = atom((get) => get(activeMutationsAtom) > 0);
const refreshActionAtom = atom<{ current: () => void }>({
  current: noopRefresh,
});

const setStatusAtom = atom(null, (_get, set, value: StatusValue) => {
  set(statusAtom, value);
});

const setKeywordAtom = atom(null, (_get, set, value: string) => {
  set(keywordAtom, value);
});

const setMenuTreeAtom = atom(
  null,
  (get, set, updater: MenuTreeUpdater) => {
    if (typeof updater === 'function') {
      const next = updater(get(menuTreeAtom));
      set(menuTreeAtom, next);
      return;
    }
    set(menuTreeAtom, updater);
  },
);

const openCreateAtom = atom(null, (_get, set, parentId: number) => {
  set(editorStateAtom, { open: true, mode: 'create', parentId });
});

const openEditAtom = atom(null, (_get, set, menu: MenuTreeNode) => {
  set(editorStateAtom, { open: true, mode: 'edit', menu });
});

const closeEditorAtom = atom(null, (_get, set) => {
  set(editorStateAtom, { open: false });
});

const setDeleteTargetAtom = atom(
  null,
  (_get, set, target: MenuTreeNode | null) => {
    set(deleteTargetAtom, target);
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

export interface MenuManagementStore {
  status: StatusValue;
  setStatus: (value: StatusValue) => void;
  keyword: string;
  setKeyword: (value: string) => void;
  menuTree: MenuTreeNode[];
  setMenuTree: (updater: MenuTreeUpdater) => void;
  editorState: EditorState;
  openCreate: (parentId: number) => void;
  openEdit: (menu: MenuTreeNode) => void;
  closeEditor: () => void;
  deleteTarget: MenuTreeNode | null;
  setDeleteTarget: (target: MenuTreeNode | null) => void;
}

export const useMenuManagementStore = (): MenuManagementStore => {
  const status = useAtomValue(statusAtom);
  const keyword = useAtomValue(keywordAtom);
  const menuTree = useAtomValue(menuTreeAtom);
  const editorState = useAtomValue(editorStateAtom);
  const deleteTarget = useAtomValue(deleteTargetAtom);

  const setStatus = useSetAtom(setStatusAtom);
  const setKeyword = useSetAtom(setKeywordAtom);
  const setMenuTree = useSetAtom(setMenuTreeAtom);
  const openCreate = useSetAtom(openCreateAtom);
  const openEdit = useSetAtom(openEditAtom);
  const closeEditor = useSetAtom(closeEditorAtom);
  const setDeleteTarget = useSetAtom(setDeleteTargetAtom);

  return {
    status,
    setStatus,
    keyword,
    setKeyword,
    menuTree,
    setMenuTree,
    editorState,
    openCreate,
    openEdit,
    closeEditor,
    deleteTarget,
    setDeleteTarget,
  };
};

export const useMenuManagementStatus = () => {
  const isRefreshing = useAtomValue(refreshingAtom);
  const isMutating = useAtomValue(isMutatingAtom);
  return { isRefreshing, isMutating };
};

export const useMenuManagementRefresh = () =>
  useAtomValue(refreshActionAtom).current;

export const useMenuManagementSetRefreshing = () =>
  useSetAtom(setRefreshingAtom);

export const useMenuManagementMutationCounter = () => {
  const begin = useSetAtom(incrementMutationsAtom);
  const end = useSetAtom(decrementMutationsAtom);
  return {
    beginMutation: begin,
    endMutation: end,
  };
};

export const useMenuManagementSetRefreshHandler = () =>
  useSetAtom(setRefreshActionAtom);
