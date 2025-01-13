'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sun, Moon, SunMoon, LucideProps } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  useState,
  useEffect,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [ThemeIcon, setThemeIcon] =
    useState<
      ForwardRefExoticComponent<
        Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
      >
    >(SunMoon); // 默认图标

  const themeOptions = [
    {
      label: '亮色主题',
      value: 'light',
    },
    {
      label: '暗黑主题',
      value: 'dark',
    },
    {
      label: '跟随系统',
      value: 'system',
    },
  ];
  const currentOption = themeOptions.find((it) => it.value === theme);

  useEffect(() => {
    switch (theme) {
      case 'light':
        setThemeIcon(Sun);
        break;
      case 'dark':
        setThemeIcon(Moon);
        break;
      default:
        setThemeIcon(SunMoon);
    }
  }, [theme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="transition-colors duration-300"
              >
                <ThemeIcon className="h-5 w-5 transition-all duration-300" />
                <span className="sr-only">主题切换</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>当前主题为{currentOption?.label}</p>
            </TooltipContent>
          </Tooltip>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {themeOptions.map((it) => (
          <DropdownMenuCheckboxItem
            key={it.value}
            checked={theme === it.value}
            onCheckedChange={() => setTheme(it.value)}
          >
            {it.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
