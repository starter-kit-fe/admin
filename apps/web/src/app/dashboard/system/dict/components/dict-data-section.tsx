'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit2, Plus, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusTabs } from '@/components/status-tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { listDictData } from '../api';
import { DATA_STATUS_TABS, DEFAULT_DEBOUNCE_MS } from '../constants';
import {
  useDictManagementSetRefreshing,
  useDictManagementStore,
} from '@/app/dashboard/system/dict/store';
import { emptyDictDataList, resolveErrorMessage } from '../utils';
import type { DictData, DictType } from '../type';

export function DictDataSection() {
  const {
    dictTypes,
    selectedDictId,
    dataStatus,
    setDataStatus,
    dataFilterForm,
    setDataFilterForm,
    dataAppliedFilters,
    applyDataFilters,
    resetDataFilters,
    dictData,
    setDictData,
    dictDataTotal,
    setDictDataTotal,
    openDataCreate,
    openDataEdit,
    setDataDeleteTarget,
  } = useDictManagementStore();
  const setRefreshing = useDictManagementSetRefreshing();

  const selectedDict: DictType | undefined = useMemo(
    () => dictTypes.find((item) => item.dictId === selectedDictId ?? -1),
    [dictTypes, selectedDictId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyDataFilters({
        dictLabel: dataFilterForm.dictLabel.trim(),
        dictValue: dataFilterForm.dictValue.trim(),
      });
    }, DEFAULT_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [applyDataFilters, dataFilterForm.dictLabel, dataFilterForm.dictValue]);

  const dataQuery = useQuery({
    queryKey: [
      'system',
      'dicts',
      'data',
      selectedDictId,
      dataStatus,
      dataAppliedFilters.dictLabel,
      dataAppliedFilters.dictValue,
    ],
    queryFn: async () => {
      if (!selectedDictId) {
        return emptyDictDataList;
      }
      return listDictData(selectedDictId, {
        status: dataStatus === 'all' ? undefined : dataStatus,
        dictLabel: dataAppliedFilters.dictLabel || undefined,
        dictValue: dataAppliedFilters.dictValue || undefined,
      });
    },
    enabled: Boolean(selectedDictId),
    keepPreviousData: true,
  });

  useEffect(() => {
    setRefreshing(dataQuery.isFetching);
  }, [dataQuery.isFetching, setRefreshing]);

  useEffect(() => {
    if (dataQuery.data) {
      setDictData(dataQuery.data.items);
      setDictDataTotal(dataQuery.data.total);
    } else {
      setDictData([]);
      setDictDataTotal(0);
    }
  }, [dataQuery.data, setDictData, setDictDataTotal]);

  if (!selectedDict || selectedDictId == null) {
    return (
      <Card className="border border-dashed border-border/50 bg-muted/40 py-14 text-center text-sm text-muted-foreground">
        请选择左侧字典类型以查看字典数据。
      </Card>
    );
  }

  const statusTabs = DATA_STATUS_TABS;

  const handleStatusChange = (value: string) => {
    setDataStatus(value as typeof statusTabs[number]['value']);
  };

  const handleAdd = () => {
    openDataCreate(selectedDict);
  };

  const handleEdit = (item: DictData) => {
    openDataEdit({ dictType: selectedDict, dictData: item });
  };

  const handleDelete = (item: DictData) => {
    setDataDeleteTarget({ dictType: selectedDict, dictData: item });
  };

  const renderStatusBadge = (status?: string | null) => {
    const meta = statusTabs.find((tab) => tab.value === status);
    if (!meta || meta.value === 'all') return null;
    return (
      <Badge
        variant="outline"
        className={cn(
          'px-2 py-0 text-[11px]',
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
    <Card className="border border-border/60 shadow-sm dark:border-border/40">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">
            {selectedDict.dictName}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            类型标识：{selectedDict.dictType}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusTabs
            value={dataStatus}
            onValueChange={handleStatusChange}
            tabs={statusTabs}
          />
          <Button type="button" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            新增字典项
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="字典标签"
            value={dataFilterForm.dictLabel}
            onChange={(event) =>
              setDataFilterForm((prev) => ({
                ...prev,
                dictLabel: event.target.value,
              }))
            }
          />
          <Input
            placeholder="字典键值"
            value={dataFilterForm.dictValue}
            onChange={(event) =>
              setDataFilterForm((prev) => ({
                ...prev,
                dictValue: event.target.value,
              }))
            }
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => resetDataFilters()}
          >
            重置
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">标签</TableHead>
                <TableHead className="w-[140px]">键值</TableHead>
                <TableHead className="w-[100px]">排序</TableHead>
                <TableHead className="w-[120px]">是否默认</TableHead>
                <TableHead className="min-w-[180px]">备注</TableHead>
                <TableHead className="w-[120px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dictData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {dataQuery.isLoading
                      ? '字典数据加载中...'
                      : '暂无字典项，请先新增。'}
                  </TableCell>
                </TableRow>
              ) : (
                dictData.map((item) => (
                  <TableRow key={item.dictCode}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{item.dictLabel}</span>
                        {renderStatusBadge(item.status)}
                      </div>
                    </TableCell>
                    <TableCell>{item.dictValue}</TableCell>
                    <TableCell>{item.dictSort ?? 0}</TableCell>
                    <TableCell>
                      {item.isDefault === 'Y' ? (
                        <Badge
                          variant="outline"
                          className="border-transparent bg-blue-500/10 px-2 py-0 text-xs text-blue-600"
                        >
                          默认
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">否</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.remark ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit2 className="size-3.5" />
                          编辑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="size-3.5" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          共 {dictDataTotal} 条字典数据。
        </p>
      </CardContent>
    </Card>
  );
}
