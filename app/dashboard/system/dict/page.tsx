"use client";

import { useEffect } from 'react';

import Header from './_components/header';
import Filter from './_components/filter';

import { getLookupGroups, getLookupList, putLookupSort, type lookupSortRequest } from '@/api';
import { useStore } from './store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ID_LOOKUP_GROUP, ID_LOOKUP_LIST } from '@/lib/constant';
import Table from './_components/table';
export default function DictionaryPage() {
    const queryClient = useQueryClient();

    // 使用字典 store
    const {
        selectedGroup,
        lookupParams,
        groupParams,
        visibleColumns,
        setGroupParams,
        setSelectedGroup,
        setLookupParams,
        setVisibleColumn,
    } = useStore();

    // 分组查询
    const {
        data: groupsData,
        isLoading: isGroupsLoading
    } = useQuery({
        queryKey: [ID_LOOKUP_GROUP, groupParams],
        queryFn: () => getLookupGroups(groupParams),
    });

    // 字典项查询
    const {
        data: lookupsData = [],
        isLoading: isLookupsLoading,
        refetch: refetchLookups
    } = useQuery({
        queryKey: [ID_LOOKUP_LIST, selectedGroup, lookupParams],
        queryFn: () => selectedGroup
            ? getLookupList(selectedGroup, lookupParams)
            : Promise.resolve([]),
        enabled: !!selectedGroup,
    });
    // 优化后的 useMutation 配置
    const { mutate } = useMutation({
        mutationFn: putLookupSort,
        onMutate: async (newSortData) => {
            // 取消任何正在进行的重新获取，避免它们覆盖我们的乐观更新
            await queryClient.cancelQueries({ queryKey: [ID_LOOKUP_LIST, selectedGroup, lookupParams] });

            // 保存当前数据，以便在失败时回滚
            const previousData = queryClient.getQueryData([ID_LOOKUP_LIST, selectedGroup, lookupParams]);

            // 乐观地更新查询数据
            queryClient.setQueryData(
                [ID_LOOKUP_LIST, selectedGroup, lookupParams],
                (old: any) => ({
                    ...old,
                    list: newSortData.list
                })
            );

            // 返回上下文对象，用于在错误时回滚
            return { previousData };
        },
        onError: (err, newSortData, context) => {
            console.error('排序更新失败:', err);
            // 回滚到之前的数据
            if (context?.previousData) {
                queryClient.setQueryData(
                    [ID_LOOKUP_LIST, selectedGroup, lookupParams],
                    context.previousData
                );
            }
            // 可以在这里添加错误通知
            // toast.error('排序更新失败，已恢复原始顺序');
        },
        onSuccess: () => {
            // 排序成功，不需要重新获取数据，可以添加通知
            // toast.success('排序已更新');
        },
    });

    // 首次加载或没有选中分组时，自动选择第一个分组
    useEffect(() => {
        if (!selectedGroup && groupsData && groupsData?.list?.length > 0) {
            setSelectedGroup(groupsData.list[0].value);
        }
    }, [groupsData, selectedGroup, setSelectedGroup]);

    // 处理状态切换
    const handleStatusChange = (status: string) => {
        const statusVal = status === 'all' ? '' : status;
        setGroupParams({ status: statusVal });
        setLookupParams({ status: statusVal });

    };

    // 处理搜索
    const handleSearch = (term: string) => {
        setLookupParams({ name: term });
    };

    // 处理分组选择
    const handleGroupSelect = (groupValue: string) => {
        setSelectedGroup(groupValue);
    };

    // 处理表格数据重新排序
    const handleReorder = (reorderedItems: lookupSortRequest) => {
        // 这里应该有一个API调用来保存新的顺序
        console.log('重新排序:', reorderedItems);
        mutate(reorderedItems)
    };
    return (
        <div className="container space-y-4">
            <Header />
            <Filter />
            <Table data={lookupsData} loading={isLookupsLoading} />
        </div>
    );
}