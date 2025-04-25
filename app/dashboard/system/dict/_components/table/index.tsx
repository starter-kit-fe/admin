"use client";

import { useState, useMemo, useEffect } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
    ColumnOrderState,
    VisibilityState,
    Table,
} from "@tanstack/react-table";
import {
    Table as TableComponent,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { lookup as DictItem } from '@/app/dashboard/system/dict/api'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps {
    data: DictItem[];
    onSortChange?: (newData: DictItem[]) => void;
    onColumnOrderChange?: (newColumnOrder: string[]) => void;
    initialColumnOrder?: string[];
    onColumnVisibilityChange?: (newVisibility: VisibilityState) => void;
    loading?: boolean;
}

// 可拖拽的行组件
function DraggableRow({ row, children }: { row: any; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: String(row.original.id),
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <TableRow ref={setNodeRef} style={style} className={cn("group", isDragging && "bg-muted")} {...attributes} {...listeners}>
            {children}
        </TableRow>
    );
}

// 可拖拽的表头组件
function DraggableHeader({ header, children }: { header: any; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `column-${header.id}`,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <TableHead
            ref={setNodeRef}
            style={style}
            className={cn("group cursor-move", isDragging && "bg-muted")}
            {...attributes}
            {...listeners}
        >
            {children}
        </TableHead>
    );
}

// 拖拽手柄组件
function DragHandle() {
    return (
        <div className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
    );
}

// 列可见性控制面板
function ColumnVisibilityPanel({ table }: { table: Table<any> }) {
    const allColumns = table.getAllColumns();
    const visibleColumns = allColumns.filter(column => column.getCanHide());

    // 列名称映射
    const columnLabels: Record<string, string> = {
        value: "值",
        sort: "排序",
        status: "状态",
        isDefault: "默认",
        remark: "备注",
        createdAt: "创建时间",
        updatedAt: "更新时间",
    };

    return (
        <div className="mt-4 flex justify-end">
            <DropdownMenu  >
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Settings2 className="mr-2 h-4 w-4" />
                        显示列
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>切换显示列</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {visibleColumns.map((column) => (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={column.getIsVisible()}
                            onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                        >
                            {columnLabels[column.id] || column.id}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

// 加载状态的表格行
function LoadingRow() {
    return (
        <TableRow>
            <TableCell className="w-10"><Skeleton className="h-4 w-4 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-4 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32 rounded-md" /></TableCell>
        </TableRow>
    );
}

// 加载状态的表头
function LoadingHeader() {
    return (
        <TableRow>
            <TableHead className="w-10"><Skeleton className="h-5 w-5 rounded-full" /></TableHead>
            <TableHead><Skeleton className="h-5 w-20 rounded-md" /></TableHead>
            <TableHead><Skeleton className="h-5 w-16 rounded-md" /></TableHead>
            <TableHead><Skeleton className="h-5 w-16 rounded-md" /></TableHead>
            <TableHead><Skeleton className="h-5 w-16 rounded-md" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24 rounded-md" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24 rounded-md" /></TableHead>
            <TableHead><Skeleton className="h-5 w-24 rounded-md" /></TableHead>
        </TableRow>
    );
}

export default function DataTable({ data, onSortChange, onColumnOrderChange, initialColumnOrder, onColumnVisibilityChange, loading = false }: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [items, setItems] = useState(data);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    // 定义列
    const columns = useMemo<ColumnDef<DictItem>[]>(
        () => [
            {
                id: "drag",
                header: "",
                cell: () => <DragHandle />,
                enableSorting: false,
                size: 40,
                enableHiding: false, // 不允许隐藏拖拽列
            },
            {
                id: "value",
                accessorKey: "value",
                header: "值",
                enableHiding: true,
            },
            {
                id: "sort",
                accessorKey: "sort",
                header: "排序",
                enableHiding: true,
            },
            {
                id: "status",
                accessorKey: "status",
                header: "状态",
                enableHiding: true,
                cell: ({ row }) => {
                    const status = row.getValue("status") as number;
                    return (
                        <Badge variant={status === 1 ? "default" : "secondary"}>
                            {status === 1 ? "启用" : "禁用"}
                        </Badge>
                    );
                },
            },
            {
                id: "isDefault",
                accessorKey: "isDefault",
                header: "默认",
                enableHiding: true,
                cell: ({ row }) => {
                    const isDefault = row.getValue("isDefault") as boolean;
                    return <Checkbox checked={isDefault} disabled />;
                },
            },
            {
                id: "remark",
                accessorKey: "remark",
                header: "备注",
                enableHiding: true,
            },
            {
                id: "createdAt",
                accessorKey: "createdAt",
                header: "创建时间",
                enableHiding: true,
                cell: ({ row }) => {
                    return new Date(row.getValue("createdAt")).toLocaleString();
                },
            },
            {
                id: "updatedAt",
                accessorKey: "updatedAt",
                header: "更新时间",
                enableHiding: true,
                cell: ({ row }) => {
                    return new Date(row.getValue("updatedAt")).toLocaleString();
                },
            },
        ],
        []
    );

    // 获取默认列顺序
    const defaultColumnOrder = useMemo(() => columns.map(column => column.id).filter(Boolean) as string[], [columns]);

    // 初始化列顺序状态
    const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
        initialColumnOrder || defaultColumnOrder
    );

    // 乐观更新状态
    const [optimisticItems, setOptimisticItems] = useState<DictItem[]>(data);
    const [optimisticColumnOrder, setOptimisticColumnOrder] = useState<ColumnOrderState>(
        initialColumnOrder || defaultColumnOrder
    );

    // 监听 data 变化并更新 items
    useEffect(() => {
        setItems(data);
        setOptimisticItems(data);
    }, [data]);

    // 监听初始列顺序变化
    useEffect(() => {
        if (initialColumnOrder) {
            setColumnOrder(initialColumnOrder);
            setOptimisticColumnOrder(initialColumnOrder);
        }
    }, [initialColumnOrder]);

    // 初始化表格
    const table = useReactTable({
        data: optimisticItems,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
            columnOrder: optimisticColumnOrder,
            columnVisibility,
        },
        onColumnOrderChange: (updater) => {
            const newColumnOrder = typeof updater === 'function'
                ? updater(optimisticColumnOrder)
                : updater;

            setColumnOrder(newColumnOrder);
            setOptimisticColumnOrder(newColumnOrder);
            onColumnOrderChange?.(newColumnOrder);
        },
        onColumnVisibilityChange: (updater) => {
            const newVisibility = typeof updater === 'function'
                ? updater(columnVisibility)
                : updater;

            setColumnVisibility(newVisibility);
            onColumnVisibilityChange?.(newVisibility);
        },
    });

    // 设置拖拽传感器
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 处理拖拽开始事件
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    // 处理拖拽结束事件
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            // 检查是否是列拖拽
            if (active.id.toString().startsWith('column-')) {
                const columnId = active.id.toString().replace('column-', '');
                const overColumnId = over?.id.toString().replace('column-', '');

                if (columnId && overColumnId) {
                    const currentOrder = optimisticColumnOrder;
                    const oldIndex = currentOrder.indexOf(columnId);
                    const newIndex = currentOrder.indexOf(overColumnId);

                    if (oldIndex !== -1 && newIndex !== -1) {
                        const newColumnOrder = arrayMove([...currentOrder], oldIndex, newIndex);
                        setColumnOrder(newColumnOrder);
                        setOptimisticColumnOrder(newColumnOrder);
                        onColumnOrderChange?.(newColumnOrder);
                    }
                }
            } else {
                // 行拖拽
                const oldIndex = items.findIndex((item) => String(item.id) === active.id);
                const newIndex = items.findIndex((item) => String(item.id) === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);
                setItems(newItems);
                setOptimisticItems(newItems);
                onSortChange?.(newItems);
            }
        }

        setActiveId(null);
    };

    // 处理拖拽悬停事件 - 实现乐观更新
    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // 检查是否是列拖拽
            if (active.id.toString().startsWith('column-')) {
                const columnId = active.id.toString().replace('column-', '');
                const overColumnId = over.id.toString().replace('column-', '');

                if (columnId && overColumnId) {
                    const currentOrder = optimisticColumnOrder;
                    const oldIndex = currentOrder.indexOf(columnId);
                    const newIndex = currentOrder.indexOf(overColumnId);

                    if (oldIndex !== -1 && newIndex !== -1) {
                        const newColumnOrder = arrayMove([...currentOrder], oldIndex, newIndex);
                        setOptimisticColumnOrder(newColumnOrder);
                    }
                }
            } else {
                // 行拖拽
                const oldIndex = optimisticItems.findIndex((item) => String(item.id) === active.id);
                const newIndex = optimisticItems.findIndex((item) => String(item.id) === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    // 立即更新数据，实现乐观更新
                    const newItems = arrayMove([...optimisticItems], oldIndex, newIndex);
                    setOptimisticItems(newItems);
                }
            }
        }
    };

    // 确保数据存在
    if (!optimisticItems || optimisticItems.length === 0) {
        return (
            <div className="rounded-md border">
                {loading ? (
                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-8 w-48 rounded-md" />
                                <Skeleton className="h-8 w-32 rounded-md" />
                            </div>
                            <div className="border rounded-md overflow-hidden">
                                <TableComponent>
                                    <TableHeader>
                                        <LoadingHeader />
                                    </TableHeader>
                                    <TableBody>
                                        <LoadingRow />
                                        <LoadingRow />
                                        <LoadingRow />
                                        <LoadingRow />
                                        <LoadingRow />
                                    </TableBody>
                                </TableComponent>
                            </div>
                            <div className="flex justify-end">
                                <Skeleton className="h-9 w-24 rounded-md" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        暂无数据
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="rounded-md border">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <TableComponent>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    <SortableContext
                                        items={optimisticColumnOrder.map(id => `column-${id}`)}
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <DraggableHeader key={header.id} header={header}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </DraggableHeader>
                                        ))}
                                    </SortableContext>
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <>
                                    <LoadingRow />
                                    <LoadingRow />
                                    <LoadingRow />
                                    <LoadingRow />
                                    <LoadingRow />
                                </>
                            ) : (
                                <SortableContext
                                    items={optimisticItems.filter(item => item.id !== undefined).map(item => String(item.id))}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {table.getRowModel().rows.map((row) => (
                                        <DraggableRow key={row.id} row={row}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </DraggableRow>
                                    ))}
                                </SortableContext>
                            )}
                        </TableBody>
                    </TableComponent>
                </DndContext>
            </div>
            <ColumnVisibilityPanel table={table} />
        </div>
    );
}
