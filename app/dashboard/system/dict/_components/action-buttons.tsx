"use client";

import { Button } from "@/components/ui/button";
import {
    PlusCircle,
    FileDown
} from "lucide-react";

interface ActionButtonsProps {
    selectedGroup: string | null;
    onSuccess?: () => void;
}

export function ActionButtons({ selectedGroup, onSuccess }: ActionButtonsProps) {
    const handleAdd = () => {
        console.log(`添加新字典项到分组: ${selectedGroup}`);
        // 这里应该打开一个添加字典项的模态框
        // 成功后调用 onSuccess
        if (onSuccess) onSuccess();
    };

    const handleExport = () => {
        console.log(`导出分组 ${selectedGroup} 的字典数据`);
        // 这里应该调用导出API或生成导出文件
    };

    return (
        <div className="flex gap-2">
            <Button
                onClick={handleAdd}
                className="cursor-pointer"
                disabled={!selectedGroup}
                size="sm"
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                新增字典项
            </Button>
            <Button
                variant="outline"
                onClick={handleExport}
                disabled={!selectedGroup}
                className="cursor-pointer"
                size="sm"
            >
                <FileDown className="mr-2 h-4 w-4" />
                导出
            </Button>
        </div>
    );
}





