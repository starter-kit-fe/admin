'use client';

import {
  useDictDataEditorActions,
  useDictDataFilterActions,
  useDictManagementSetRefreshHandler,
  useDictManagementSetRefreshing,
  useDictSelection,
  useDictTypeAppliedFilters,
  useDictTypeDeleteState,
  useDictTypeEditorActions,
  useDictTypeStatus,
  useDictTypesState,
} from '@/app/dashboard/system/dict/store';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { type DictListParams, listDictTypes } from '../../api';
import { BASE_TYPE_QUERY_KEY } from '../../constants';
import type { DictType } from '../../type';
import { DictTypeList } from '../list/dict-type-list';

export function DictTypeSection() {
  const { typeStatus } = useDictTypeStatus();
  const { typeAppliedFilters } = useDictTypeAppliedFilters();
  const { dictTypes, setDictTypes } = useDictTypesState();
  const { selectedDictId, setSelectedDictId } = useDictSelection();
  const { openTypeEdit } = useDictTypeEditorActions();
  const { openDataCreate } = useDictDataEditorActions();
  const { setTypeDeleteTarget } = useDictTypeDeleteState();
  const { setDataFilterForm, applyDataFilters } = useDictDataFilterActions();
  const setRefreshing = useDictManagementSetRefreshing();
  const setRefreshHandler = useDictManagementSetRefreshHandler();
  const queryClient = useQueryClient();

  const queryParams = useMemo<DictListParams>(
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
      return;
    }

    if (!typeQuery.isLoading) {
      setDictTypes([]);
    }
  }, [setDictTypes, typeQuery.data, typeQuery.isLoading]);

  useEffect(() => {
    setRefreshing(typeQuery.isFetching);
  }, [setRefreshing, typeQuery.isFetching]);

  useEffect(() => {
    setRefreshHandler(() => {
      void queryClient.invalidateQueries({ queryKey: BASE_TYPE_QUERY_KEY });
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

  const handleAddData = (dict: DictType) => {
    openDataCreate(dict);
  };

  const handleEdit = (dict: DictType) => {
    openTypeEdit(dict);
  };

  const handleDelete = (dict: DictType) => {
    setTypeDeleteTarget(dict);
  };

  return (
    <Card className="border py-0 shadow-none lg:h-[600px]">
      <CardContent className="px-0 py-0">
        <DictTypeList
          items={dictTypes}
          selectedId={selectedDictId}
          isLoading={typeQuery.isLoading}
          onSelect={handleSelect}
          onAddData={handleAddData}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </CardContent>
    </Card>
  );
}
