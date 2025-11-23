'use client';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Monitor, Moon, Settings2, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import {
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

type ThemeValue = 'light' | 'dark' | 'system';
type ThemeOption = {
  value: ThemeValue;
  icon: typeof Sun;
  labelKey: `items.${ThemeValue}`;
};
const THEME_ITEMS: ThemeOption[] = [
  { value: 'light', labelKey: 'items.light', icon: Sun },
  { value: 'dark', labelKey: 'items.dark', icon: Moon },
  { value: 'system', labelKey: 'items.system', icon: Monitor },
];
// 颜色选项：只负责设置 data-color，真正改 --primary 在 CSS 里做
const COLOR_ITEMS = [
  { value: 'zinc', labelKey: 'colorOptions.zinc', dotClass: 'bg-zinc-500' },
  { value: 'red', labelKey: 'colorOptions.red', dotClass: 'bg-red-500' },
  { value: 'rose', labelKey: 'colorOptions.rose', dotClass: 'bg-rose-500' },
  {
    value: 'orange',
    labelKey: 'colorOptions.orange',
    dotClass: 'bg-orange-500',
  },
  { value: 'green', labelKey: 'colorOptions.green', dotClass: 'bg-green-500' },
  { value: 'blue', labelKey: 'colorOptions.blue', dotClass: 'bg-blue-500' },
  {
    value: 'yellow',
    labelKey: 'colorOptions.yellow',
    dotClass: 'bg-yellow-500',
  },
  {
    value: 'violet',
    labelKey: 'colorOptions.violet',
    dotClass: 'bg-violet-500',
  },
] as const;

type ColorValue = (typeof COLOR_ITEMS)[number]['value'] | 'default';

const RADIUS_ITEMS = [
  { value: '0', label: '0' },
  { value: '0.25', label: '0.25' },
  { value: '0.5', label: '0.5' },
  { value: '0.75', label: '0.75' },
  { value: '1', label: '1' },
] as const;

type RadiusValue = (typeof RADIUS_ITEMS)[number]['value'];

const LAYOUT_ITEMS = [
  { value: 'full', labelKey: 'layoutOptions.full' },
  { value: 'centered', labelKey: 'layoutOptions.centered' },
] as const;

type LayoutValue = (typeof LAYOUT_ITEMS)[number]['value'];

const FONT_SIZE_ITEMS = [
  { value: 'default', labelKey: 'fontSizeOptions.default' },
  { value: 'sm', labelKey: 'fontSizeOptions.sm' },
  { value: 'md', labelKey: 'fontSizeOptions.md' },
  { value: 'lg', labelKey: 'fontSizeOptions.lg' },
] as const;

type FontSizeValue = (typeof FONT_SIZE_ITEMS)[number]['value'];

const runThemeTransition = (
  event: ReactMouseEvent<HTMLElement> | null,
  updateTheme: () => void,
) => {
  if (
    typeof document === 'undefined' ||
    typeof window === 'undefined' ||
    typeof (document as any).startViewTransition !== 'function'
  ) {
    updateTheme();
    return;
  }

  const pointerX = event?.clientX ?? Math.floor(window.innerWidth / 2);
  const pointerY = event?.clientY ?? Math.floor(window.innerHeight / 2);

  const transition = (document as any).startViewTransition(() => {
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
  const isMobile = useIsMobile();

  // 本地 UI 状态（颜色 / 圆角 / 布局）
  const [activeColor, setActiveColor] = useState<ColorValue>('default');
  const [activeRadius, setActiveRadius] = useState<RadiusValue>('0.5');
  const [activeLayout, setActiveLayout] = useState<LayoutValue>('full');
  const [activeFontSize, setActiveFontSize] =
    useState<FontSizeValue>('default');

  useEffect(() => {
    setMounted(true);
  }, []);

  // 初始化从 localStorage 读取自定义设置
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    const storedColor =
      (window.localStorage.getItem('ui-color') as ColorValue | null) ??
      'default';
    const storedRadius =
      (window.localStorage.getItem('ui-radius') as RadiusValue | null) ?? '0.5';
    const storedLayout =
      (window.localStorage.getItem('ui-layout') as LayoutValue | null) ??
      'full';
    const storedFontSize =
      (window.localStorage.getItem('ui-font-size') as FontSizeValue | null) ??
      'default';

    if (storedColor === 'default') {
      root.removeAttribute('data-color');
    } else {
      root.dataset.color = storedColor;
    }
    root.dataset.radius = storedRadius;
    root.dataset.layout = storedLayout;
    if (storedFontSize === 'default') {
      root.removeAttribute('data-font-size');
    } else {
      root.dataset['fontSize'] = storedFontSize;
    }

    setActiveColor(storedColor);
    setActiveRadius(storedRadius);
    setActiveLayout(storedLayout);
    setActiveFontSize(storedFontSize);
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

  // 保留原来的亮/暗/系统逻辑 + 动画
  const handleThemeSelection =
    (value: ThemeValue) => (event: ReactMouseEvent<HTMLElement>) => {
      runThemeTransition(event, () => setTheme(value));
    };

  // 颜色
  const handleColorChange = (value: ColorValue) => () => {
    if (typeof document === 'undefined') return;
    if (value === 'default') {
      document.documentElement.removeAttribute('data-color');
      window.localStorage.removeItem('ui-color');
    } else {
      document.documentElement.dataset.color = value;
      window.localStorage.setItem('ui-color', value);
    }
    setActiveColor(value);
  };

  // 圆角
  const handleRadiusChange = (value: RadiusValue) => () => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.radius = value;
    window.localStorage.setItem('ui-radius', value);
    setActiveRadius(value);
  };

  // 布局
  const handleLayoutChange = (value: LayoutValue) => () => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.layout = value;
    window.localStorage.setItem('ui-layout', value);
    setActiveLayout(value);
  };

  const handleFontSizeChange = (value: FontSizeValue) => () => {
    if (typeof document === 'undefined') return;
    if (value === 'default') {
      document.documentElement.removeAttribute('data-font-size');
      window.localStorage.removeItem('ui-font-size');
    } else {
      document.documentElement.dataset.fontSize = value;
      window.localStorage.setItem('ui-font-size', value);
    }
    setActiveFontSize(value);
  };

  const handleReset = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.removeAttribute('data-color');
    root.removeAttribute('data-radius');
    root.removeAttribute('data-layout');
    root.removeAttribute('data-font-size');
    window.localStorage.removeItem('ui-color');
    window.localStorage.removeItem('ui-radius');
    window.localStorage.removeItem('ui-layout');
    window.localStorage.removeItem('ui-font-size');
    setActiveColor('default');
    setActiveRadius('0.5');
    setActiveLayout('full');
    setActiveFontSize('default');
    runThemeTransition(null, () => setTheme('system'));
  };

  const triggerButton = (
    <Button
      variant="outline"
      size="icon"
      className={cn('relative size-10 rounded-full', className)}
      aria-label={t('ariaLabel')}
    >
      <Settings2 className="h-[1.1rem] w-[1.1rem]" />
      <span className="sr-only">{t('ariaLabel')}</span>
    </Button>
  );

  const content = (
    <>
      <p className="block px-2 pb-2 text-xs text-muted-foreground sm:hidden">
        {t('description')}
      </p>
      {/* Color */}
      <div className="space-y-2 px-2 pb-3">
        <p className="text-xs font-medium text-muted-foreground sm:mt-3">
          {t('sections.color')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleColorChange('default')}
            className={cn(
              'flex items-center justify-between rounded-md border px-3 py-2 text-xs',
              activeColor === 'default' &&
                'border-primary bg-primary/5 ring-1 ring-primary/40',
            )}
          >
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span>{t('colorOptions.default')}</span>
            </span>
          </button>
          {COLOR_ITEMS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={handleColorChange(item.value)}
              className={cn(
                'flex items-center justify-between rounded-md border px-3 py-2 text-xs',
                'transition-colors',
                activeColor === item.value &&
                  'border-primary bg-primary/5 ring-1 ring-primary/40',
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn('h-2.5 w-2.5 rounded-full', item.dotClass)}
                />
                <span>{t(item.labelKey)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Radius */}
      <div className="space-y-2 px-2 pb-3">
        <p className="text-xs font-medium text-muted-foreground">
          {t('sections.radius')}
        </p>
        <div className="grid grid-cols-5 gap-2">
          {RADIUS_ITEMS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={handleRadiusChange(item.value)}
              className={cn(
                'rounded-md border px-2 py-1 text-xs',
                activeRadius === item.value &&
                  'border-primary bg-primary/5 ring-1 ring-primary/40',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div className="space-y-2 px-2 pb-3">
        <p className="text-xs font-medium text-muted-foreground">
          {t('sections.fontSize')}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {FONT_SIZE_ITEMS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={handleFontSizeChange(item.value)}
              className={cn(
                'rounded-md border px-1 py-1 text-xs',
                activeFontSize === item.value &&
                  'border-primary bg-primary/5 ring-1 ring-primary/40',
              )}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Color mode */}
      <div className="space-y-2 px-2 pb-3">
        <p className="text-xs font-medium text-muted-foreground">
          {t('sections.theme')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {THEME_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTheme === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={handleThemeSelection(item.value)}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs',
                  isActive &&
                    'border-primary bg-primary/5 ring-1 ring-primary/40',
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout */}
      <DropdownMenuSeparator />
      <div className="space-y-2 px-2 py-3">
        <p className="text-xs font-medium text-muted-foreground">
          {t('sections.layout')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUT_ITEMS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={handleLayoutChange(item.value)}
              className={cn(
                'rounded-md border px-2 py-1 text-xs',
                activeLayout === item.value &&
                  'border-primary bg-primary/5 ring-1 ring-primary/40',
              )}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <DropdownMenuSeparator />
      <div className="px-2 pb-1 pt-1">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-center text-xs"
          onClick={handleReset}
        >
          {t('reset')}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="px-0 pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-base text-left pl-5 font-semibold">
              {t('drawerTitle')}
            </DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto px-3">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* <Button
          variant="outline"
          size="icon"
          className={cn('relative size-10 rounded-full', className)}
          aria-label={t('ariaLabel')}
        >
          <ActiveIcon className="h-[1.1rem] w-[1.1rem] transition-transform duration-200" />
          <span className="sr-only">{t('ariaLabel')}</span>
        </Button> */}
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {content}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ThemeToggle;
