"use client";

import { useState, useRef, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "../../store";

// 定义表单验证模式
const formSchema = z.object({
    name: z.string().min(1, "搜索内容不能为空").max(50, "搜索内容不能超过50个字符"),
});

type FormValues = z.infer<typeof formSchema>;

export default function FilterForm() {
    const { setLookupParams, lookupParams } = useStore();
    const [searchValue, setSearchValue] = useState("");
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 初始化表单
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: searchValue,
        },
    });

    const debouncedOnChange = useCallback((newValue: string) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            setSearchValue(newValue);
            setLookupParams({ ...lookupParams, name: newValue });
        }, 500);
    }, [lookupParams, setLookupParams]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        debouncedOnChange(newValue);
        form.setValue("name", newValue);
    }, [debouncedOnChange, form]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            setSearchValue(e.currentTarget.value);
            setLookupParams({ ...lookupParams, name: e.currentTarget.value });
        }
    }, [lookupParams, setLookupParams]);

    const handleClear = useCallback(() => {
        setSearchValue("");
        setLookupParams({ ...lookupParams, name: "" });
        form.setValue("name", "");
    }, [lookupParams, setLookupParams, form]);

    return (
        <Form {...form}>
            <form className={cn("relative max-w-[300px] w-fit")}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        {...field}
                                        value={searchValue}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="搜索..."
                                        className="pl-10 pr-10"
                                    />
                                    {searchValue && (
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
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
}