"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface StatusFilterProps {
    status: string;
    onStatusChange: (status: string) => void;
}

export function StatusFilter({ status, onStatusChange }: StatusFilterProps) {
    return (
        <Tabs value={status} onValueChange={onStatusChange} className=" w-fit">
            <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="1">正常</TabsTrigger>
                <TabsTrigger value="0">停用</TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
