'use client';

import {
  useDictManagementMutationCounter,
  useDictManagementRefresh,
  useDictManagementSetRefreshHandler,
  useDictManagementSetRefreshing,
  useDictManagementStore,
} from '@/app/dashboard/system/dict/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';

import { type DictListParams, listDictTypes } from '../api';
import { BASE_TYPE_QUERY_KEY, TYPE_STATUS_TABS } from '../constants';
import type { DictType } from '../type';
import { resolveErrorMessage } from '../utils';

export function DictTypeSection() {
  const {
    typeStatus,
    typeAppliedFilters,
    dictTypes,
    setDictTypes,
    selectedDictId,
    setSelectedDictId,
    openTypeEdit,
    openDataCreate,
    setTypeDeleteTarget,
    applyDataFilters,
    setDataFilterForm,
  } = useDictManagementStore();
  const setRefreshing = useDictManagementSetRefreshing();
  const setRefreshHandler = useDictManagementSetRefreshHandler();
  const { beginMutation, endMutation } = useDictManagementMutationCounter();
  const refresh = useDictManagementRefresh();
  const queryClient = useQueryClient();

  const queryParams: DictListParams = useMemo(
    () => ({
      status: typeStatus === 'all' ? undefined : typeStatus,
      dictName: typeAppliedFilters.dictName || undefined,
      dictType: typeAppliedFilters.dictType || undefined,
    }),
    [typeAppliedFilters.dictName, typeAppliedFilters.dictType, typeStatus],
  );

  const typeQuery = useQuery({
    queryKey: [...BASE_TYPE_QUERY_KEY, queryParams],
    queryFn: () => listDictTypes(queryParams),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (typeQuery.data) {
      setDictTypes(typeQuery.data);
    } else if (!typeQuery.isLoading) {
      setDictTypes([]);
    }
  }, [setDictTypes, typeQuery.data, typeQuery.isLoading]);

  useEffect(() => {
    setRefreshing(typeQuery.isFetching);
  }, [setRefreshing, typeQuery.isFetching]);

  useEffect(() => {
    setRefreshHandler(() => {
      void queryClient.invalidateQueries({ queryKey: ['system', 'dicts'] });
    });
    return () => {
      setRefreshHandler(() => {});
    };
  }, [queryClient, setRefreshHandler]);

  useEffect(() => {
    if (dictTypes.length === 0) {
      setSelectedDictId(null);
      return;
    }
    setSelectedDictId((prev) => {
      if (prev != null && dictTypes.some((item) => item.dictId === prev)) {
        return prev;
      }
      return dictTypes[0]?.dictId ?? null;
    });
  }, [dictTypes, setSelectedDictId]);

  const handleSelect = (dict: DictType) => {
    setSelectedDictId(dict.dictId ?? null);
    setDataFilterForm({ dictLabel: '', dictValue: '' });
    applyDataFilters({ dictLabel: '', dictValue: '' }, { force: true });
  };

  const handleDelete = async (dict: DictType) => {
    setTypeDeleteTarget(dict);
  };

  const handleAddData = (dict: DictType) => {
    openDataCreate(dict);
  };

  const renderStatusBadge = (status?: string | null) => {
    const meta = TYPE_STATUS_TABS.find((tab) => tab.value === status);
    if (!meta || meta.value === 'all') {
      return null;
    }
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-transparent px-2 py-0 text-[11px] font-medium',
          status === '0'
            ? 'bg-emerald-500/10 text-emerald-600'
            : 'bg-rose-500/10 text-rose-600',
        )}
      >
        {meta.label}
      </Badge>
    );
  };

  return (
    <Card className="border border-border/60 bg-card  dark:border-border/40">
      <CardContent className="px-0 py-0">
        <ScrollArea className="h-[420px]">
          <div className="flex flex-col divide-y divide-border/60">
            {typeQuery.isLoading && dictTypes.length === 0 ? (
              <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
                字典类型加载中...
              </div>
            ) : dictTypes.length === 0 ? (
              <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
                暂无字典类型，点击右上角新建。
              </div>
            ) : (
              dictTypes.map((dict) => {
                const isActive = dict.dictId === selectedDictId;
                return (
                  <div
                    key={dict.dictId}
                    className={cn(
                      'flex flex-col gap-2 px-4 py-3 transition-colors',
                      isActive
                        ? 'bg-primary/5 text-primary-foreground'
                        : 'hover:bg-muted/40',
                    )}
                  >
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-1 text-left"
                      onClick={() => handleSelect(dict)}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          {dict.dictName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dict.dictType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {renderStatusBadge(dict.status)}
                        {dict.remark ? (
                          <span className="line-clamp-1">{dict.remark}</span>
                        ) : null}
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openTypeEdit(dict)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <Edit2 className="size-3.5" />
                        编辑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddData(dict)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        <Plus className="size-3.5" />
                        新增字典项
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(dict)}
                        className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        删除
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
