'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createConfig,
  updateConfig,
  type CreateConfigPayload,
  type UpdateConfigPayload,
} from '../../api';
import {
  useConfigManagementMutationCounter,
  useConfigManagementRefresh,
  useConfigEditorActions,
  useConfigEditorState,
} from '@/app/dashboard/system/config/store';
import { resolveErrorMessage, toFormValues } from '../../utils';
import type { ConfigFormValues } from '../../type';
import { ConfigEditorDialog } from './config-editor-dialog';
import { useTranslations } from 'next-intl';

export function ConfigEditorManager() {
  const editorState = useConfigEditorState();
  const { closeEditor } = useConfigEditorActions();
  const refresh = useConfigManagementRefresh();
  const { beginMutation, endMutation } =
    useConfigManagementMutationCounter();
  const tToast = useTranslations('ConfigManagement.toast');

  const createMutation = useMutation({
    mutationFn: (payload: CreateConfigPayload) => createConfig(payload),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(tToast('createSuccess'));
      closeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, tToast('createError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateConfigPayload;
    }) => updateConfig(id, payload),
    onMutate: () => {
      beginMutation();
    },
    onSuccess: () => {
      toast.success(tToast('updateSuccess'));
      closeEditor();
      refresh();
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, tToast('updateError')));
    },
    onSettled: () => {
      endMutation();
    },
  });

  const mode: 'create' | 'edit' =
    editorState.open && editorState.mode === 'edit' ? 'edit' : 'create';

  const defaultValues = useMemo<ConfigFormValues | undefined>(() => {
    if (!editorState.open || editorState.mode === 'create') {
      return undefined;
    }
    return toFormValues(editorState.config);
  }, [editorState]);

  const submitting =
    createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (values: ConfigFormValues) => {
    const payload: CreateConfigPayload = {
      configName: values.configName.trim(),
      configKey: values.configKey.trim(),
      configValue: values.configValue.trim(),
      configType: values.configType,
      remark: values.remark.trim() ? values.remark.trim() : undefined,
    };
    if (editorState.open && editorState.mode === 'edit') {
      updateMutation.mutate({
        id: editorState.config.configId,
        payload,
      });
      return;
    }
    createMutation.mutate(payload);
  };

  return (
    <ConfigEditorDialog
      mode={mode}
      open={editorState.open}
      defaultValues={defaultValues}
      submitting={submitting}
      onOpenChange={(open) => {
        if (!open) {
          closeEditor();
        }
      }}
      onSubmit={handleSubmit}
    />
  );
}
