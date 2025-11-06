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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { cn } from '@/lib/utils';

import { DeleteConfirmDialog } from '../user/components/delete-confirm-dialog';

import {
  createDictData,
  createDictType,
  listDictData,
  listDictTypes,
  removeDictData,
  removeDictType,
  updateDictData,
  updateDictType,
  type CreateDictDataPayload,
  type CreateDictTypePayload,
  type DictDataListParams,
  type DictListParams,
  type UpdateDictDataPayload,
  type UpdateDictTypePayload,
} from './api';
import { DictDataEditorDialog } from './components/dict-data-editor-dialog';
import { DictTypeEditorDialog } from './components/dict-type-editor-dialog';
import type {
  DictData,
  DictDataFormValues,
  DictDataList,
  DictType,
  DictTypeFormValues,
} from './type';

const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '正常' },
  { value: '1', label: '停用' },
] as const;

const DATA_STATUS_TABS = STATUS_TABS;
const DEFAULT_DEBOUNCE_MS = 250;

type StatusValue = (typeof STATUS_TABS)[number]['value'];
type DataStatusValue = (typeof DATA_STATUS_TABS)[number]['value'];

type TypeEditorState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; dictType: DictType };

type DataEditorState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; dictData: DictData };

interface DeleteTypeState {
  open: boolean;
  dictType?: DictType;
}

interface DeleteDataState {
  open: boolean;
  dictData?: DictData;
}

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

function toDictTypeFormValues(dict: DictType): DictTypeFormValues {
  return {
    dictName: dict.dictName ?? '',
    dictType: dict.dictType ?? '',
    status: dict.status ?? '0',
    remark: dict.remark ?? '',
  };
}

function toDictDataFormValues(data: DictData): DictDataFormValues {
  return {
    dictLabel: data.dictLabel ?? '',
    dictValue: data.dictValue ?? '',
    dictSort: data.dictSort ?? 0,
    status: data.status ?? '0',
    isDefault: data.isDefault ?? 'N',
    remark: data.remark ?? '',
  };
}

export function DictManagement() {
  const queryClient = useQueryClient();

  const [typeStatus, setTypeStatus] = useState<StatusValue>('all');
  const [dictNameInput, setDictNameInput] = useState('');
  const [dictTypeInput, setDictTypeInput] = useState('');
  const [selectedDictId, setSelectedDictId] = useState<number | null>(null);

  const [dataStatus, setDataStatus] = useState<DataStatusValue>('all');
  const [dictLabelInput, setDictLabelInput] = useState('');
  const [dictValueInput, setDictValueInput] = useState('');

  const [typeEditorState, setTypeEditorState] = useState<TypeEditorState>({ open: false });
  const [dataEditorState, setDataEditorState] = useState<DataEditorState>({ open: false });
  const [deleteTypeState, setDeleteTypeState] = useState<DeleteTypeState>({ open: false });
  const [deleteDataState, setDeleteDataState] = useState<DeleteDataState>({ open: false });

  const debouncedDictName = useDebouncedValue(dictNameInput.trim(), DEFAULT_DEBOUNCE_MS);
  const debouncedDictType = useDebouncedValue(dictTypeInput.trim(), DEFAULT_DEBOUNCE_MS);
  const debouncedDictLabel = useDebouncedValue(dictLabelInput.trim(), DEFAULT_DEBOUNCE_MS);
  const debouncedDictValue = useDebouncedValue(dictValueInput.trim(), DEFAULT_DEBOUNCE_MS);

  const typeQueryParams: DictListParams = {
    status: typeStatus === 'all' ? undefined : typeStatus,
    dictName: debouncedDictName || undefined,
    dictType: debouncedDictType || undefined,
  };

  const typeQuery = useQuery({
    queryKey: ['system', 'dicts', 'types', typeQueryParams],
    queryFn: () => listDictTypes(typeQueryParams),
  });

	const dictTypes = typeQuery.data ?? [];
	const dictTypeCount = dictTypes.length;

  useEffect(() => {
    if (typeQuery.isLoading) {
      return;
    }
    if (dictTypes.length === 0) {
      setSelectedDictId(null);
      return;
    }
    setSelectedDictId((current) => {
      if (current != null && dictTypes.some((item) => item.dictId === current)) {
        return current;
      }
      return dictTypes[0]?.dictId ?? null;
    });
  }, [dictTypes, typeQuery.isLoading]);

  const selectedDict = useMemo(() => {
    if (selectedDictId == null) {
      return undefined;
    }
    return dictTypes.find((item) => item.dictId === selectedDictId);
  }, [dictTypes, selectedDictId]);

  const dataQueryParams: DictDataListParams = {
    status: dataStatus === 'all' ? undefined : dataStatus,
    dictLabel: debouncedDictLabel || undefined,
    dictValue: debouncedDictValue || undefined,
  };

  const dataQuery = useQuery<DictDataList | undefined>({
    queryKey: ['system', 'dicts', selectedDictId, 'data', dataQueryParams],
    queryFn: () => {
      if (selectedDictId == null) {
        return Promise.resolve(undefined);
      }
      return listDictData(selectedDictId, dataQueryParams);
    },
    enabled: selectedDictId != null,
  });

	const dictDataItems = dataQuery.data?.items ?? [];
	const dictDataCount = dictDataItems.length;

  const createTypeMutation = useMutation({
    mutationFn: (payload: CreateDictTypePayload) => createDictType(payload),
    onSuccess: (data) => {
      toast.success('新增字典类型成功');
      queryClient.invalidateQueries({ queryKey: ['system', 'dicts', 'types'] });
      setSelectedDictId(data.dictId);
      setTypeEditorState({ open: false });
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '新增字典类型失败'));
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDictTypePayload }) =>
      updateDictType(id, payload),
    onSuccess: () => {
      toast.success('更新字典类型成功');
      queryClient.invalidateQueries({ queryKey: ['system', 'dicts', 'types'] });
      setTypeEditorState({ open: false });
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '更新字典类型失败'));
    },
  });

  const removeTypeMutation = useMutation({
    mutationFn: (id: number) => removeDictType(id),
    onSuccess: (_, id) => {
      toast.success('字典类型已删除');
      queryClient.invalidateQueries({ queryKey: ['system', 'dicts', 'types'] });
      setDeleteTypeState({ open: false });
      setSelectedDictId((current) => (current === id ? null : current));
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '删除字典类型失败'));
    },
  });

  const createDataMutation = useMutation({
    mutationFn: ({ dictId, payload }: { dictId: number; payload: CreateDictDataPayload }) =>
      createDictData(dictId, payload),
    onSuccess: () => {
      toast.success('新增字典数据成功');
      if (selectedDictId != null) {
        queryClient.invalidateQueries({ queryKey: ['system', 'dicts', selectedDictId, 'data'] });
      }
      setDataEditorState({ open: false });
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '新增字典数据失败'));
    },
  });

  const updateDataMutation = useMutation({
    mutationFn: ({
      dictId,
      code,
      payload,
    }: {
      dictId: number;
      code: number;
      payload: UpdateDictDataPayload;
    }) => updateDictData(dictId, code, payload),
    onSuccess: () => {
      toast.success('更新字典数据成功');
      if (selectedDictId != null) {
        queryClient.invalidateQueries({ queryKey: ['system', 'dicts', selectedDictId, 'data'] });
      }
      setDataEditorState({ open: false });
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '更新字典数据失败'));
    },
  });

  const removeDataMutation = useMutation({
    mutationFn: ({ dictId, code }: { dictId: number; code: number }) => removeDictData(dictId, code),
    onSuccess: () => {
      toast.success('字典数据已删除');
      if (selectedDictId != null) {
        queryClient.invalidateQueries({ queryKey: ['system', 'dicts', selectedDictId, 'data'] });
      }
      setDeleteDataState({ open: false });
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '删除字典数据失败'));
    },
  });

  const handleTypeSubmit = async (values: DictTypeFormValues) => {
    const payload: CreateDictTypePayload = {
      dictName: values.dictName,
      dictType: values.dictType,
      status: values.status,
      remark: values.remark.trim() ? values.remark.trim() : undefined,
    };

    if (!typeEditorState.open) {
      return;
    }

    try {
      if (typeEditorState.mode === 'create') {
        await createTypeMutation.mutateAsync(payload);
      } else {
        await updateTypeMutation.mutateAsync({
          id: typeEditorState.dictType.dictId,
          payload,
        });
      }
    } catch {
      // handled in mutation onError
    }
  };

  const handleDataSubmit = async (values: DictDataFormValues) => {
    if (selectedDictId == null || !dataEditorState.open) {
      return;
    }

    const payload: CreateDictDataPayload = {
      dictLabel: values.dictLabel,
      dictValue: values.dictValue,
      dictSort: values.dictSort,
      status: values.status,
      isDefault: values.isDefault,
      remark: values.remark.trim() ? values.remark.trim() : undefined,
    };

    try {
      if (dataEditorState.mode === 'create') {
        await createDataMutation.mutateAsync({ dictId: selectedDictId, payload });
      } else {
        await updateDataMutation.mutateAsync({
          dictId: selectedDictId,
          code: dataEditorState.dictData.dictCode,
          payload,
        });
      }
    } catch {
      // handled in mutation onError
    }
  };

  const isTypeMutationPending =
    createTypeMutation.isPending || updateTypeMutation.isPending;
  const isDataMutationPending =
    createDataMutation.isPending || updateDataMutation.isPending;

  const selectedDictDisplay = selectedDict ?? dataQuery.data?.type;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
			<div className="grid gap-6 lg:grid-cols-[360px_1fr]">
				<Card className="border-border/70 shadow-sm">
					<CardHeader className="space-y-4">
						<div className="flex flex-col gap-3">
							<div className="flex flex-col gap-2">
								<CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  字典类型
                  {dictTypeCount > 0 ? (
                    <span className="text-sm font-normal text-muted-foreground">
                      {dictTypeCount} 个
                    </span>
                  ) : null}
                </CardTitle>
								<CardDescription>维护系统中的业务字典类型，支持按名称、编码和状态筛选。</CardDescription>
							</div>
							<div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void typeQuery.refetch()}
                  disabled={typeQuery.isLoading || typeQuery.isRefetching}
                >
                  {typeQuery.isRefetching ? (
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
                <Button
                  onClick={() => setTypeEditorState({ open: true, mode: 'create' })}
                  disabled={isTypeMutationPending}
                >
                  <Plus className="mr-2 size-4" />
                  新增类型
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Tabs value={typeStatus} onValueChange={(value) => setTypeStatus(value as StatusValue)}>
                <TabsList className="w-full justify-start">
                  {STATUS_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex flex-col gap-3">
                <Input
                  placeholder="按字典类型编码筛选"
                  value={dictTypeInput}
                  onChange={(event) => setDictTypeInput(event.target.value)}
                />
                <Input
                  placeholder="按字典名称筛选"
                  value={dictNameInput}
                  onChange={(event) => setDictNameInput(event.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {typeQuery.isLoading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <InlineLoading label="加载中" />
              </div>
            ) : typeQuery.isError ? (
              <div className="py-10 text-center text-sm text-destructive">加载字典类型失败，请稍后再试。</div>
            ) : dictTypes.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">暂无字典类型，可点击上方按钮新增。</div>
            ) : (
              <ScrollArea className="max-h-[520px] pr-1">
                <ul className="space-y-2">
                  {dictTypes.map((item) => {
                    const isActive = item.dictId === selectedDictId;
                    return (
                      <li key={item.dictId}>
                        <div
                          className={cn(
                            'overflow-hidden rounded-xl border border-border/60 bg-background transition-all',
                            isActive && 'border-primary/70 shadow-sm ring-2 ring-primary/30',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedDictId(item.dictId)}
                            aria-current={isActive}
                            className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                          >
                            <div>
                              <div className="text-sm font-medium text-foreground sm:text-base">
                                {item.dictName}
                              </div>
                              <div className="mt-1 text-xs font-mono text-muted-foreground">
                                {item.dictType}
                              </div>
                              {item.remark ? (
                                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                                  {item.remark}
                                </p>
                              ) : null}
                            </div>
                            <Badge variant={item.status === '0' ? 'secondary' : 'outline'}>
                              {item.status === '0' ? '正常' : '停用'}
                            </Badge>
                          </button>
                          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 bg-muted/50 px-3 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setTypeEditorState({ open: true, mode: 'edit', dictType: item })
                              }
                            >
                              <Edit2 className="mr-1 size-4" />
                              编辑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTypeState({ open: true, dictType: item })}
                            >
                              <Trash2 className="mr-1 size-4" />
                              删除
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
					</CardContent>
				</Card>

				<Card className="border-border/70 shadow-sm">
					<CardHeader className="space-y-4">
						<div className="flex flex-col gap-3">
							<div className="flex flex-col gap-2">
								<CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  字典数据
                  {selectedDictId != null ? (
                    <span className="text-sm font-normal text-muted-foreground">
                      {dictDataCount} 条
                    </span>
                  ) : null}
                </CardTitle>
								<CardDescription>
									{selectedDictDisplay
										? `当前字典：${selectedDictDisplay.dictName}（${selectedDictDisplay.dictType}）`
                    : '请选择左侧字典类型后维护数据项。'}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void dataQuery.refetch()}
                  disabled={selectedDictId == null || dataQuery.isLoading || dataQuery.isRefetching}
                >
                  {dataQuery.isRefetching ? (
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
                <Button
                  onClick={() => selectedDictId != null && setDataEditorState({ open: true, mode: 'create' })}
                  disabled={selectedDictId == null || isDataMutationPending}
                >
                  <Plus className="mr-2 size-4" />
                  新增数据
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Tabs value={dataStatus} onValueChange={(value) => setDataStatus(value as DataStatusValue)}>
                <TabsList className="w-full justify-start">
                  {DATA_STATUS_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  placeholder="按字典标签筛选"
                  value={dictLabelInput}
                  onChange={(event) => setDictLabelInput(event.target.value)}
                />
                <Input
                  placeholder="按字典键值筛选"
                  value={dictValueInput}
                  onChange={(event) => setDictValueInput(event.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDictId == null ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                请先在左侧选择一个字典类型。
              </div>
            ) : dataQuery.isLoading ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <InlineLoading label="加载中" />
              </div>
            ) : dataQuery.isError ? (
              <div className="py-10 text-center text-sm text-destructive">加载字典数据失败，请稍后再试。</div>
            ) : dictDataItems.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">暂无字典数据，可点击上方按钮新增。</div>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {dictDataItems.map((item) => (
                    <div key={item.dictCode} className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-medium text-foreground">{item.dictLabel}</div>
                          <div className="mt-1 text-xs font-mono text-muted-foreground">
                            键值：{item.dictValue}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">排序 {item.dictSort}</Badge>
                            <Badge variant={item.status === '0' ? 'secondary' : 'outline'}>
                              {item.status === '0' ? '正常' : '停用'}
                            </Badge>
                            {item.isDefault === 'Y' ? <Badge variant="default">默认</Badge> : null}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDataEditorState({ open: true, mode: 'edit', dictData: item })}
                          >
                            <Edit2 className="size-4" />
                            <span className="sr-only">编辑</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDataState({ open: true, dictData: item })}
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[160px]">字典标签</TableHead>
                          <TableHead className="min-w-[140px]">字典键值</TableHead>
                          <TableHead className="w-[100px]">排序</TableHead>
                          <TableHead className="w-[100px]">状态</TableHead>
                          <TableHead className="w-[100px]">默认</TableHead>
                          <TableHead>备注</TableHead>
                          <TableHead className="w-[120px] text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dictDataItems.map((item) => (
                          <TableRow key={item.dictCode}>
                            <TableCell className="font-medium text-foreground">{item.dictLabel}</TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">{item.dictValue}</TableCell>
                            <TableCell>{item.dictSort}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === '0' ? 'secondary' : 'outline'}>
                                {item.status === '0' ? '正常' : '停用'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.isDefault === 'Y' ? <Badge variant="default">默认</Badge> : <Badge variant="outline">否</Badge>}
                            </TableCell>
                            <TableCell className="max-w-[240px] truncate text-muted-foreground">
                              {item.remark ?? '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setDataEditorState({ open: true, mode: 'edit', dictData: item })
                                  }
                                >
                                  <Edit2 className="size-4" />
                                  <span className="sr-only">编辑</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteDataState({ open: true, dictData: item })}
                                >
                                  <Trash2 className="size-4" />
                                  <span className="sr-only">删除</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
					</CardContent>
				</Card>
			</div>

      <DictTypeEditorDialog
        open={typeEditorState.open}
        mode={typeEditorState.open ? typeEditorState.mode : 'create'}
        defaultValues={
          typeEditorState.open && typeEditorState.mode === 'edit'
            ? toDictTypeFormValues(typeEditorState.dictType)
            : undefined
        }
        submitting={isTypeMutationPending}
        onOpenChange={(open) => {
          if (!open) {
            setTypeEditorState({ open: false });
          }
        }}
        onSubmit={handleTypeSubmit}
      />

      <DictDataEditorDialog
        open={dataEditorState.open}
        mode={dataEditorState.open ? dataEditorState.mode : 'create'}
        defaultValues={
          dataEditorState.open && dataEditorState.mode === 'edit'
            ? toDictDataFormValues(dataEditorState.dictData)
            : undefined
        }
        submitting={isDataMutationPending}
        onOpenChange={(open) => {
          if (!open) {
            setDataEditorState({ open: false });
          }
        }}
        onSubmit={handleDataSubmit}
      />

      <DeleteConfirmDialog
        open={deleteTypeState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTypeState({ open: false });
          }
        }}
        title="删除字典类型"
        description={
          deleteTypeState.dictType
            ? `确定要删除字典类型“${deleteTypeState.dictType.dictName}”吗？其下字典数据也会一并移除。`
            : '确定要删除该字典类型吗？'
        }
        loading={removeTypeMutation.isPending}
        onConfirm={() => {
          if (!deleteTypeState.dictType || removeTypeMutation.isPending) {
            return;
          }
          removeTypeMutation.mutate(deleteTypeState.dictType.dictId);
        }}
      />

      <DeleteConfirmDialog
        open={deleteDataState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDataState({ open: false });
          }
        }}
        title="删除字典数据"
        description={
          deleteDataState.dictData
            ? `确定要删除字典数据“${deleteDataState.dictData.dictLabel}”吗？`
            : '确定要删除该字典数据吗？'
        }
        loading={removeDataMutation.isPending}
        onConfirm={() => {
          if (!deleteDataState.dictData || selectedDictId == null || removeDataMutation.isPending) {
            return;
          }
          removeDataMutation.mutate({
            dictId: selectedDictId,
            code: deleteDataState.dictData.dictCode,
          });
        }}
      />
    </div>
  );
}
