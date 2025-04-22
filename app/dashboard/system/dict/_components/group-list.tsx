"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type group } from "../api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface GroupListProps {
    groups: group[];
    selectedGroup: string | null;
    onSelect: (groupValue: string) => void;
    isLoading: boolean;
    className?: string;
}

export function GroupList({
    groups,
    selectedGroup,
    onSelect,
    isLoading,
    className,
}: GroupListProps) {
    const renderSkeleton = () => (
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex justify-between items-center p-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-8" />
                </div>
            ))}
        </div>
    );

    const renderEmptyState = () => (
        <div className="text-center py-4 text-muted-foreground">
            暂无字典分组
        </div>
    );

    const renderGroupItem = (group: group) => {
        const isSelected = selectedGroup === group.value;
        return (
            <button
                key={group.value}
                className={cn(
                    "flex w-full justify-between items-center p-2 rounded-md transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20",
                    isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                )}
                onClick={() => onSelect(group.value)}
                aria-selected={isSelected}
                role="option"
            >
                <span className="text-sm truncate">
                    {group.value}
                </span>
                <Badge variant={isSelected ? "default" : "outline"}>
                    {group.total}
                </Badge>
            </button>
        );
    };

    return (
        <div className={cn("shadow-none py-3", className)}>
            {isLoading && groups.length === 0 ? (
                renderSkeleton()
            ) : groups.length === 0 ? (
                renderEmptyState()
            ) : (
                <div
                    className="space-y-1"
                    role="listbox"
                    aria-label="字典分组列表"
                >
                    {groups.map(renderGroupItem)}
                </div>
            )}
        </div>
    );
}
