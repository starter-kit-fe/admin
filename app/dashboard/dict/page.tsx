"use client";

import { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { StatusFilter } from './_components/status-filter';
import { SearchBar } from './_components/search-bar';
import { ActionButtons } from './_components/action-buttons';
import { ColumnToggle } from './_components/column-toggle';
import { GroupList } from './_components/group-list';
import { LookupTable } from './_components/lookup-table';
import { getLookupGroups, getLookupList, type lookup } from '@/api';
import { useStore } from './store';
import { useQuery } from '@tanstack/react-query';
import { ID_LOOKUP_GROUP, ID_LOOKUP_LIST } from '@/lib/constant';

export default function DictionaryPage() {
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
        data: lookupsData,
        isLoading: isLookupsLoading,
        refetch: refetchLookups
    } = useQuery({
        queryKey: [ID_LOOKUP_LIST, selectedGroup, lookupParams],
        queryFn: () => selectedGroup
            ? getLookupList(selectedGroup, lookupParams)
            : Promise.resolve({ list: [], page: 1, total: 0 }),
        enabled: !!selectedGroup,
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
    const handleReorder = (reorderedItems: lookup[]) => {
        // 这里应该有一个API调用来保存新的顺序
        console.log('重新排序:', reorderedItems);
    };

    return (
        <div className="container py-6 space-y-6">
            {/* 状态筛选Tab */}
            <StatusFilter
                status={lookupParams.status || 'all'}
                onStatusChange={handleStatusChange}
            />

            {/* 搜索栏 */}
            <SearchBar
                value={lookupParams.name || ''}
                onChange={handleSearch}
                placeholder="搜索字典项..."
            />

            {/* 操作按钮和列设置 */}
            <div className="flex justify-between items-center">
                <ActionButtons
                    selectedGroup={selectedGroup}
                    onSuccess={() => refetchLookups()}
                />
                <ColumnToggle
                    columns={visibleColumns}
                    onToggle={(column, visible) => setVisibleColumn(column, visible)}
                />
            </div>

            {/* 主体内容区域 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* 左侧分组列表 */}
                <div className="md:col-span-1">
                    <GroupList
                        groups={groupsData?.list || []}
                        selectedGroup={selectedGroup}
                        onSelect={handleGroupSelect}
                        isLoading={isGroupsLoading}
                    />
                </div>

                {/* 右侧字典表格 */}
                <div className="md:col-span-4">
                    <Card>
                        <LookupTable
                            data={lookupsData?.list || []}
                            columns={visibleColumns}
                            isLoading={isLookupsLoading}
                            onReorder={handleReorder}
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
}