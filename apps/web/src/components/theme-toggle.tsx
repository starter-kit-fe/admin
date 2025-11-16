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
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import {
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

type ThemeOption = {
  value: 'light' | 'dark' | 'system';
  icon: typeof Sun;
};
type ThemeValue = ThemeOption['value'];

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
  const t = useTranslations('ThemeToggle');
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const themeOptions: ThemeOption[] = [
    { value: 'light', icon: Sun },
    { value: 'dark', icon: Moon },
    { value: 'system', icon: Monitor },
  ];

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
    themeOptions.find((item) => item.value === activeTheme)?.icon ?? Monitor;

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
          className={cn('relative size-10 rounded-full', className)}
          aria-label={t('ariaLabel')}
        >
          <ActiveIcon className="h-[1.1rem] w-[1.1rem] transition-transform duration-200" />
          <span className="sr-only">{t('ariaLabel')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('menuLabel')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOptions.map((item) => {
          const Icon = item.icon;
          const isActive = theme === item.value;
          return (
            <DropdownMenuItem
              key={item.value}
              className="flex items-center gap-2"
              onClick={handleThemeSelection(item.value)}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-sm">{t(`items.${item.value}`)}</span>
              {isActive && (
                <span className="rounded-full bg-primary/15 px-2 text-xs text-primary">
                  {t('current')}
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
