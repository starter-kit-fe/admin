"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    delay?: number;
    className?: string;
}

export default function SearchBar({
    value,
    onChange,
    placeholder = "搜索...",
    delay = 500,
    className
}: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedOnChange = useCallback((newValue: string) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            onChange(newValue);
        }, delay);
    }, [delay, onChange]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        debouncedOnChange(newValue);
    }, [debouncedOnChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            onChange(localValue);
        }
    }, [localValue, onChange]);

    const handleClear = useCallback(() => {
        setLocalValue("");
        onChange("");
    }, [onChange]);

    // 当外部value变化时同步到本地
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <div className={cn("relative max-w-[300px] w-fit", className)}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                value={localValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="pl-10 pr-10"
            />
            {localValue && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
