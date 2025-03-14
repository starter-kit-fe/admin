"use client";

import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { StatusFilter } from './_components/status-filter';
import { SearchBar } from './_components/search-bar';
import { ActionButtons } from './_components/action-buttons';
import { ColumnToggle } from './_components/column-toggle';
import { GroupList } from './_components/group-list';
import { LookupTable } from './_components/lookup-table';
import { getLookupGroups, getLookupList,type group, type lookup } from '@/api';

export default function DictionaryPage() {
    // 状态管理
    const [status, setStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groups, setGroups] = useState<group[]>([]);
    const [lookups, setLookups] = useState<lookup[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 表格列控制
    const [visibleColumns, setVisibleColumns] = useState({
        id: true,
        label: true,
        value: true,
        sort: true,
        status: true,
        isDefault: true,
        remark: false,
        createdAt: false,
        updatedAt: false,
        actions: true,
    });

    // 加载分组数据
    useEffect(() => {
        const loadGroups = async () => {
            setIsLoading(true);
            try {
                const res = await getLookupGroups({});
                setGroups(res.list || []);
                if (res.list && res.list.length > 0 && !selectedGroup) {
                    setSelectedGroup(res.list[0].value);
                }
            } catch (error) {
                console.error('Failed to load dictionary groups:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadGroups();
    }, [selectedGroup]);

    // 加载字典数据
    useEffect(() => {
        const loadLookups = async () => {
            if (!selectedGroup) return;

            setIsLoading(true);
            try {
                const params = {
                    name: searchTerm || undefined,
                    status: status !== 'all' ? status : undefined
                };
                const res = await getLookupList(selectedGroup, params);
                setLookups(res.list || []);
            } catch (error) {
                console.error('Failed to load dictionary items:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadLookups();
    }, [selectedGroup, status, searchTerm]);

    // 处理分组选择
    const handleGroupSelect = (groupValue: string) => {
        setSelectedGroup(groupValue);
    };

    // 处理表格数据重新排序
    const handleReorder = (reorderedItems: lookup[]) => {
        setLookups(reorderedItems);
        // 这里应该有一个API调用来保存新的顺序
    };

    return (
        <div className="container py-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">字典管理</h1>
            </div>

            {/* 状态筛选Tab */}
            <StatusFilter status={status} onStatusChange={setStatus} />
            
            {/* 搜索栏 */}
            <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="搜索字典项..."
            />
            
            {/* 操作按钮和列设置 */}
            <div className="flex justify-between items-center">
                <ActionButtons selectedGroup={selectedGroup} />
                <ColumnToggle
                    columns={visibleColumns}
                    onToggle={setVisibleColumns}
                />
            </div>
            
            <Separator />
            
            {/* 主体内容区域 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* 左侧分组列表 */}
                <div className="md:col-span-1">
                    <GroupList
                        groups={groups}
                        selectedGroup={selectedGroup}
                        onSelect={handleGroupSelect}
                        isLoading={isLoading}
                    />
                </div>
                
                {/* 右侧字典表格 */}
                <div className="md:col-span-3">
                    <Card>
                        <LookupTable
                            data={lookups}
                            columns={visibleColumns}
                            isLoading={isLoading}
                            onReorder={handleReorder}
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
}