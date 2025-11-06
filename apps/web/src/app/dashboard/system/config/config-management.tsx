'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { Edit2, Plus, RefreshCcw, Trash2 } from 'lucide-react';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { DeleteConfirmDialog } from '../user/components/delete-confirm-dialog';

import {
  createConfig,
  listConfigs,
  removeConfig,
  updateConfig,
  type ConfigListParams,
  type CreateConfigPayload,
  type UpdateConfigPayload,
} from './api';
import { ConfigEditorDialog } from './components/config-editor-dialog';
import type { ConfigFormValues, SystemConfig } from './type';

const CONFIG_TYPE_TABS = [
  { value: 'all', label: '全部' },
  { value: 'Y', label: '系统内置' },
  { value: 'N', label: '自定义' },
] as const;

type ConfigTypeValue = (typeof CONFIG_TYPE_TABS)[number]['value'];

type EditorState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; config: SystemConfig };

interface DeleteState {
  open: boolean;
  config?: SystemConfig;
}

const CONFIG_TYPE_LABELS: Record<string, string> = {
  Y: '系统内置',
  N: '自定义',
};

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

function toFormValues(config: SystemConfig): ConfigFormValues {
  return {
    configName: config.configName ?? '',
    configKey: config.configKey ?? '',
    configValue: config.configValue ?? '',
    configType: config.configType ?? 'N',
    remark: config.remark ?? '',
  };
}

export function ConfigManagement() {
  const queryClient = useQueryClient();

  const [configType, setConfigType] = useState<ConfigTypeValue>('all');
  const [nameInput, setNameInput] = useState('');
  const [keyInput, setKeyInput] = useState('');

  const [editorState, setEditorState] = useState<EditorState>({ open: false });
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });

  const debouncedName = useDebouncedValue(nameInput.trim(), 250);
  const debouncedKey = useDebouncedValue(keyInput.trim(), 250);

  const queryParams: ConfigListParams = useMemo(
    () => ({
      configName: debouncedName || undefined,
      configKey: debouncedKey || undefined,
      configType: configType === 'all' ? undefined : configType,
    }),
    [configType, debouncedKey, debouncedName],
  );

  const query = useQuery({
    queryKey: ['system', 'configs', queryParams],
    queryFn: () => listConfigs(queryParams),
  });

  const configs = query.data ?? [];
  const configCount = configs.length;

  const createMutation = useMutation({
    mutationFn: (payload: CreateConfigPayload) => createConfig(payload),
    onSuccess: () => {
      toast.success('新增参数成功');
      queryClient.invalidateQueries({ queryKey: ['system', 'configs'] });
      setEditorState({ open: false });
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '新增参数失败'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateConfigPayload }) =>
      updateConfig(id, payload),
    onSuccess: () => {
      toast.success('参数已更新');
      queryClient.invalidateQueries({ queryKey: ['system', 'configs'] });
      setEditorState({ open: false });
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '更新参数失败'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeConfig(id),
    onSuccess: () => {
      toast.success('参数已删除');
      queryClient.invalidateQueries({ queryKey: ['system', 'configs'] });
      setDeleteState({ open: false });
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '删除参数失败'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: ConfigFormValues) => {
    if (!editorState.open) {
      return;
    }

    const payload: CreateConfigPayload = {
      configName: values.configName,
      configKey: values.configKey,
      configValue: values.configValue,
      configType: values.configType,
      remark: values.remark.trim() ? values.remark.trim() : undefined,
    };

    try {
      if (editorState.mode === 'create') {
        await createMutation.mutateAsync(payload);
      } else {
        await updateMutation.mutateAsync({
          id: editorState.config.configId,
          payload,
        });
      }
    } catch {
      // handled by mutation onError
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                参数设置
                {configCount > 0 ? (
                  <span className="text-sm font-normal text-muted-foreground">
                    {configCount} 条
                  </span>
                ) : null}
              </CardTitle>
              <CardDescription>
                管理系统运行参数，可按名称、键名及类型筛选，支持快速新增或编辑。
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void query.refetch()}
                disabled={query.isLoading || query.isRefetching}
              >
                {query.isRefetching ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    刷新中
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 size-4" />
                    刷新
                  </>
                )}
              </Button>
              <Button onClick={() => setEditorState({ open: true, mode: 'create' })} disabled={isSubmitting}>
                <Plus className="mr-2 size-4" />
                新增参数
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <Tabs value={configType} onValueChange={(value) => setConfigType(value as ConfigTypeValue)}>
              <TabsList className="w-full justify-start">
                {CONFIG_TYPE_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="按参数名称筛选"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
              />
              <Input
                placeholder="按参数键名筛选"
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <InlineLoading label="加载中" />
            </div>
          ) : query.isError ? (
            <div className="py-10 text-center text-sm text-destructive">
              加载参数失败，请稍后再试。
            </div>
          ) : configs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              暂无参数，可点击右上角按钮新增。
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {configs.map((item) => (
                  <div
                    key={item.configId}
                    className="rounded-xl border border-border/60 bg-background p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-medium text-foreground">{item.configName}</div>
                        <div className="mt-1 text-xs font-mono text-muted-foreground">
                          键名：{item.configKey}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground break-words">
                          键值：{item.configValue}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Badge variant={item.configType === 'Y' ? 'secondary' : 'outline'}>
                            {CONFIG_TYPE_LABELS[item.configType] ?? item.configType}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditorState({ open: true, mode: 'edit', config: item })}
                        >
                          <Edit2 className="size-4" />
                          <span className="sr-only">编辑</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteState({ open: true, config: item })}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">删除</span>
                        </Button>
                      </div>
                    </div>
                    {item.remark ? (
                      <p className="mt-3 text-sm text-muted-foreground">备注：{item.remark}</p>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr className="text-left">
                        <th className="min-w-[160px] px-4 py-3 font-medium text-muted-foreground">参数名称</th>
                        <th className="min-w-[180px] px-4 py-3 font-medium text-muted-foreground">参数键名</th>
                        <th className="min-w-[220px] px-4 py-3 font-medium text-muted-foreground">参数键值</th>
                        <th className="w-[120px] px-4 py-3 font-medium text-muted-foreground">类型</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">备注</th>
                        <th className="w-[120px] px-4 py-3 text-right font-medium text-muted-foreground">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs.map((item) => (
                        <tr key={item.configId} className="border-b last:border-none">
                          <td className="px-4 py-3 font-medium text-foreground">{item.configName}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.configKey}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.configValue}</td>
                          <td className="px-4 py-3">
                            <Badge variant={item.configType === 'Y' ? 'secondary' : 'outline'}>
                              {CONFIG_TYPE_LABELS[item.configType] ?? item.configType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {item.remark && item.remark.trim().length > 0 ? item.remark : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditorState({ open: true, mode: 'edit', config: item })}
                              >
                                <Edit2 className="size-4" />
                                <span className="sr-only">编辑</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteState({ open: true, config: item })}
                              >
                                <Trash2 className="size-4" />
                                <span className="sr-only">删除</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfigEditorDialog
        open={editorState.open}
        mode={editorState.open ? editorState.mode : 'create'}
        defaultValues={
          editorState.open && editorState.mode === 'edit'
            ? toFormValues(editorState.config)
            : undefined
        }
        submitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            setEditorState({ open: false });
          }
        }}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({ open: false });
          }
        }}
        title="删除参数"
        description={
          deleteState.config
            ? `确定要删除参数“${deleteState.config.configName}”吗？`
            : '确定要删除该参数吗？'
        }
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteState.config || deleteMutation.isPending) {
            return;
          }
          deleteMutation.mutate(deleteState.config.configId);
        }}
      />
    </div>
  );
}
