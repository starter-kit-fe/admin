'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

export default function LangToggle() {
  const langOptions = [
    {
      label: '简体中文',
      value: 'zh-cn',
    },
    {
      label: 'English',
      value: 'en',
    },
  ];
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
                <Globe className="h-5 w-5 transition-all duration-300" />
                <span className="sr-only">语言切换</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>当前语言为简体中文</p>
            </TooltipContent>
          </Tooltip>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {langOptions.map((it) => (
          <DropdownMenuCheckboxItem
            key={it.value}
            checked={'zh-cn' === it.value}

            // checked={theme === it.value}
            // onCheckedChange={() => setTheme(it.value)}
          >
            {it.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
