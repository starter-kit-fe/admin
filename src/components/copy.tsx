'use client';

import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCopyToClipboard } from 'react-use';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [, copyToClipboard] = useCopyToClipboard();
  const [isCopying, setIsCopying] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const CopyIcon = useMemo(() => (isCopying ? Check : Copy), [isCopying]);

  const handleClick = () => {
    copyToClipboard(text);
    setIsCopying(true);
    setIsTooltipVisible(true); // 显示 Tooltip
    setTimeout(() => {
      setIsCopying(false);
      setIsTooltipVisible(false); // 隐藏 Tooltip
    }, 2000);
  };

  return (
    <TooltipProvider>
      <Tooltip open={isTooltipVisible} onOpenChange={setIsTooltipVisible}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={className}
            onClick={handleClick}
          >
            <CopyIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isCopying ? '已复制!' : '复制到剪切板'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
