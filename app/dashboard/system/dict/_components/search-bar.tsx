"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    delay?: number;
}

export function SearchBar({
    value,
    onChange,
    placeholder = "搜索...",
    delay = 500
}: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value);

    // 使用useEffect和setTimeout实现输入防抖
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [localValue, delay, onChange, value]);

    // 当外部value变化时同步到本地
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <div className="relative max-w-[300px] w-fit">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className="pl-10"
            />
        </div>
    );
}
