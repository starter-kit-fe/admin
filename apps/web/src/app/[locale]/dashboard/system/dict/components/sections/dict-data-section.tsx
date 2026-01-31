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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { listDictData } from '../../api';
import { DATA_STATUS_TABS, DEFAULT_DEBOUNCE_MS } from '../../constants';
import type { DictData, DictType } from '../../type';
import { areDictDataListsEqual, emptyDictDataList } from '../../utils';
import { DictDataFilters } from '../filters/dict-data-filters';
import { DictDataTable } from '../list/dict-data-table';
import { DictDataToolbar } from '../toolbars/dict-data-toolbar';

export function DictDataSection() {
  const t = useTranslations('DictManagement');
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
  const isMobile = useIsMobile();
  const selectedDict: DictType | undefined = useMemo(() => {
    if (selectedDictId == null) {
      return undefined;
    }
    return dictTypes.find((item) => item.id === selectedDictId);
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
      const items = dataQuery.data.list ?? [];
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
      <Card className="border border-dashed border-border/50 bg-muted/40 py-10 text-center text-sm text-muted-foreground sm:py-14">
        {t('data.selectPrompt')}
      </Card>
    );
  }

  const statusTabs = DATA_STATUS_TABS.map((tab) => ({
    value: tab.value,
    label: t(tab.labelKey),
  }));

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
    <Card
      className={cn(
        'flex flex-col shadow-none',
        isMobile ? 'gap-4' : 'lg:h-[620px]',
      )}
    >
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DictDataToolbar
          status={dataStatus}
          statusTabs={statusTabs}
          onStatusChange={handleStatusChange}
          onAdd={handleAdd}
          addLabel={t('data.toolbar.add')}
        />
      </CardHeader>
      <CardContent
        className={cn(
          'flex flex-col gap-4',
          isMobile ? 'pb-2' : 'flex-1 overflow-hidden',
        )}
      >
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

        <div
          className={cn(
            'flex-1',
            isMobile ? 'space-y-3 overflow-visible' : 'overflow-hidden',
          )}
        >
          <DictDataTable
            rows={dictData}
            isLoading={dataQuery.isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            className={isMobile ? '' : 'h-full'}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {t('data.total', { count: dictDataTotal })}
        </p>
      </CardContent>
    </Card>
  );
}
