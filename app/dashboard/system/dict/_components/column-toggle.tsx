"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";

interface ColumnToggleProps {
    columns: Record<string, boolean>;
    onToggle: (column: string, visible: boolean) => void;
}

export function ColumnToggle({ columns, onToggle }: ColumnToggleProps) {
    // 列名称映射
    const columnLabels: Record<string, string> = {
        id: "ID",
        label: "标签",
        value: "值",
        sort: "排序",
        status: "状态",
        isDefault: "默认",
        remark: "备注",
        createdAt: "创建时间",
        updatedAt: "更新时间",
        actions: "操作",
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings2 className="mr-2 h-4 w-4" />
                    显示列
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>切换显示列</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.keys(columns).map((key) => (
                    <DropdownMenuCheckboxItem
                        key={key}
                        checked={columns[key]}
                        onCheckedChange={(checked) => onToggle(key, !!checked)}
                    >
                        {columnLabels[key] || key}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
