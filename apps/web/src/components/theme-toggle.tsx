"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

const THEME_ITEMS = [
  { value: "light", label: "浅色模式", icon: Sun },
  { value: "dark", label: "深色模式", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = useMemo(() => {
    if (!mounted) {
      return "system";
    }
    if (!theme || theme === "system") {
      return systemTheme ?? "system";
    }
    return theme;
  }, [mounted, theme, systemTheme]);

  const ActiveIcon =
    THEME_ITEMS.find((item) => item.value === activeTheme)?.icon ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-10 w-10 rounded-full border border-border/60 hover:border-border hover:bg-muted/50",
            className
          )}
          aria-label="切换主题"
        >
          <ActiveIcon className="h-[1.1rem] w-[1.1rem] transition-transform duration-200" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>外观模式</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = theme === item.value;
          return (
            <DropdownMenuItem
              key={item.value}
              className="flex items-center gap-2"
              onClick={() => setTheme(item.value)}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-sm">{item.label}</span>
              {isActive && (
                <span className="rounded-full bg-primary/15 px-2 text-xs text-primary">
                  当前
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeToggle;
