"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type group } from "../api";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupListProps {
    groups: group[];
    selectedGroup: string | null;
    onSelect: (groupValue: string) => void;
    isLoading: boolean;
}

export function GroupList({
    groups,
    selectedGroup,
    onSelect,
    isLoading
}: GroupListProps) {
    if (isLoading && groups.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>字典分组</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex justify-between items-center p-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-5 w-8" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>字典分组</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {groups.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                            暂无字典分组
                        </div>
                    ) : (
                        groups.map((group) => (
                            <div
                                key={group.value}
                                className={`flex justify-between items-center p-2 rounded-md cursor-pointer transition-colors ${selectedGroup === group.value
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted"
                                    }`}
                                onClick={() => onSelect(group.value)}
                            >
                                <span className="font-medium truncate">
                                    {group.value}
                                </span>
                                <Badge variant="outline">
                                    {group.total}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
