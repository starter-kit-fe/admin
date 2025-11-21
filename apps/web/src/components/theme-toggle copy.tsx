'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

const THEME_ITEMS = [
  { value: 'light', label: '浅色模式', icon: Sun },
  { value: 'dark', label: '深色模式', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
] as const;

type ThemeValue = (typeof THEME_ITEMS)[number]['value'];

const runThemeTransition = (
  event: ReactMouseEvent<HTMLElement> | null,
  updateTheme: () => void,
) => {
  if (
    typeof document === 'undefined' ||
    typeof window === 'undefined' ||
    typeof document.startViewTransition !== 'function'
  ) {
    updateTheme();
    return;
  }

  const pointerX = event?.clientX ?? Math.floor(window.innerWidth / 2);
  const pointerY = event?.clientY ?? Math.floor(window.innerHeight / 2);

  const transition = document.startViewTransition(() => {
    updateTheme();
  });

  transition.ready
    .then(() => {
      const radius = Math.hypot(
        Math.max(pointerX, window.innerWidth - pointerX),
        Math.max(pointerY, window.innerHeight - pointerY),
      );

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${pointerX}px ${pointerY}px)`,
            `circle(${radius}px at ${pointerX}px ${pointerY}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => {
      /* fallback silently */
    });
};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = useMemo(() => {
    if (!mounted) {
      return 'system';
    }
    if (!theme || theme === 'system') {
      return systemTheme ?? 'system';
    }
    return theme;
  }, [mounted, theme, systemTheme]);

  const ActiveIcon =
    THEME_ITEMS.find((item) => item.value === activeTheme)?.icon ?? Monitor;

  const handleThemeSelection =
    (value: ThemeValue) => (event: ReactMouseEvent<HTMLElement>) => {
      runThemeTransition(event, () => setTheme(value));
    };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('relative size-10 rounded-full  ', className)}
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
              onClick={handleThemeSelection(item.value)}
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
