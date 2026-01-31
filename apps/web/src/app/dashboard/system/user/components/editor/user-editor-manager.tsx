'use client';

import { useMutation } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { toast } from 'sonner';

import { createUser, updateUser } from '../../api';
import {
  useUserManagementMutationCounter,
  useUserManagementRefresh,
  useUserManagementStore,
} from '../../store';
import type { UserFormValues } from '../../type';
import { UserEditorDialog } from '../dialogs/user-editor-dialog';
import { sanitizeDeptId, sanitizeIdList, toFormValues } from '../utils';

export function UserEditorManager() {
  const { editorState, closeEditor } = useUserManagementStore();
  const refresh = useUserManagementRefresh();
  const { beginMutation, endMutation } = useUserManagementMutationCounter();
  const submitLockRef = useRef(false);

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) => {
      const deptId = sanitizeDeptId(values.deptId);
      const roleIds = sanitizeIdList(values.roleIds);
      const postIds = sanitizeIdList(values.postIds);
      const remark = values.remark.trim();
      return createUser({
        userName: values.userName.trim(),
        nickName: values.nickName.trim(),
        deptId,
        email: values.email.trim(),
        phonenumber: values.phonenumber.trim(),
        sex: values.sex,
        status: values.status,
        password: values.password?.trim() ?? '',
        remark: remark === '' ? undefined : remark,
        roleIds,
        postIds,
      });
    },
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('用户创建成功');
      closeEditor();
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '创建用户失败，请稍后再试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
      submitLockRef.current = false;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: UserFormValues }) => {
      const deptId = sanitizeDeptId(values.deptId);
      const roleIds = sanitizeIdList(values.roleIds);
      const postIds = sanitizeIdList(values.postIds);
      const remark = values.remark.trim();

      return updateUser(id, {
        userName: values.userName.trim(),
        nickName: values.nickName.trim(),
        deptId,
        email: values.email.trim(),
        phonenumber: values.phonenumber.trim(),
        sex: values.sex,
        status: values.status,
        remark: remark === '' ? undefined : remark,
        roleIds,
        postIds,
      });
    },
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success('用户信息已更新');
      closeEditor();
      refresh();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : '更新用户失败，请稍后再试';
      toast.error(message);
    },
    onSettled: () => {
      endMutation();
      submitLockRef.current = false;
    },
  });

  const isEditMode =
    editorState.open && 'mode' in editorState && editorState.mode === 'edit';

  const editorDefaultValues = useMemo<UserFormValues | undefined>(() => {
    if (!isEditMode) {
      return undefined;
    }
    return toFormValues(editorState.user);
  }, [editorState, isEditMode]);

  const editingUser = isEditMode ? editorState.user : null;

  const mode: 'create' | 'edit' = isEditMode ? 'edit' : 'create';

  const handleSubmit = (values: UserFormValues) => {
    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;

    if (isEditMode) {
      updateMutation.mutate({
        id: editorState.user.id,
        values,
      });
      return;
    }

    createMutation.mutate(values);
  };

  return (
    <UserEditorDialog
      mode={mode}
      open={editorState.open}
      defaultValues={editorDefaultValues}
      submitting={createMutation.isPending || updateMutation.isPending}
      editingUser={editingUser}
      onOpenChange={(open) => {
        if (!open) {
          closeEditor();
        }
      }}
      onSubmit={handleSubmit}
    />
  );
}
