'use client';

import {
  type DataStatusValue,
  useDictDataAppliedFilters,
  useDictDataDeleteState,
  useDictDataEditorActions,
  useDictDataFilterForm,
  useDictDataState,
  useDictDataStatus,
  useDictManagementSetRefreshing,
  useDictSelection,
  useDictTypesState,
} from '@/app/dashboard/system/dict/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { listDictData } from '../../api';
import { DATA_STATUS_TABS, DEFAULT_DEBOUNCE_MS } from '../../constants';
import type { DictData, DictType } from '../../type';
import { areDictDataListsEqual, emptyDictDataList } from '../../utils';
import { DictDataFilters } from '../filters/dict-data-filters';
import { DictDataTable } from '../list/dict-data-table';
import { DictDataToolbar } from '../toolbars/dict-data-toolbar';

export function DictDataSection() {
  const { dictTypes } = useDictTypesState();
  const { selectedDictId } = useDictSelection();
  const { dataStatus, setDataStatus } = useDictDataStatus();
  const { dataFilterForm, setDataFilterForm } = useDictDataFilterForm();
  const { dataAppliedFilters, applyDataFilters } = useDictDataAppliedFilters();
  const { dictData, setDictData, dictDataTotal, setDictDataTotal } =
    useDictDataState();
  const { openDataCreate, openDataEdit } = useDictDataEditorActions();
  const { setDataDeleteTarget } = useDictDataDeleteState();
  const setRefreshing = useDictManagementSetRefreshing();
  const selectedDict: DictType | undefined = useMemo(() => {
    if (selectedDictId == null) {
      return undefined;
    }
    return dictTypes.find((item) => item.dictId === selectedDictId);
  }, [dictTypes, selectedDictId]);

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
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setRefreshing(dataQuery.isFetching);
  }, [dataQuery.isFetching, setRefreshing]);

  useEffect(() => {
    if (dataQuery.data) {
      const items = dataQuery.data.items ?? [];
      if (!areDictDataListsEqual(items, dictData)) {
        setDictData(items);
      }
      if (dictDataTotal !== items.length) {
        setDictDataTotal(items.length);
      }
      return;
    }

    if (dictData.length !== 0) {
      setDictData([]);
    }
    if (dictDataTotal !== 0) {
      setDictDataTotal(0);
    }
  }, [dataQuery.data, dictData, dictDataTotal, setDictData, setDictDataTotal]);

  if (!selectedDict || selectedDictId == null) {
    return (
      <Card className="border border-dashed border-border/50 bg-muted/40 py-14 text-center text-sm text-muted-foreground">
        请选择左侧字典类型以查看字典数据。
      </Card>
    );
  }

  const statusTabs = DATA_STATUS_TABS;

  const handleStatusChange = (value: string) => {
    setDataStatus(value as DataStatusValue);
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

  return (
    <Card className="flex h-[620px] flex-col shadow-none">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DictDataToolbar
          status={dataStatus}
          statusTabs={statusTabs}
          onStatusChange={handleStatusChange}
          onAdd={handleAdd}
        />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
        <DictDataFilters
          dictLabel={dataFilterForm.dictLabel}
          dictValue={dataFilterForm.dictValue}
          onDictLabelChange={(value) =>
            setDataFilterForm((prev) => ({ ...prev, dictLabel: value }))
          }
          onDictValueChange={(value) =>
            setDataFilterForm((prev) => ({ ...prev, dictValue: value }))
          }
        />

        <div className="flex-1 overflow-hidden">
          <DictDataTable
            rows={dictData}
            isLoading={dataQuery.isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            className="h-full"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          共 {dictDataTotal} 条字典数据。
        </p>
      </CardContent>
    </Card>
  );
}
