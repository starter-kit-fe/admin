'use client';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NoticeFiltersBarProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  noticeType: string;
  noticeTypeOptions: { value: string; label: string }[];
  onNoticeTypeChange: (value: string) => void;
}

export function NoticeFiltersBar({
  keyword,
  onKeywordChange,
  noticeType,
  noticeTypeOptions,
  onNoticeTypeChange,
}: NoticeFiltersBarProps) {
  const t = useTranslations('NoticeManagement.filters');
  const handleKeywordClear = () => {
    if (keyword) {
      onKeywordChange('');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <div className="w-full min-w-0 flex-1 sm:w-72">
          <InputGroup className="w-full border-muted bg-muted/60">
            <InputGroupAddon>
              <Search className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={t('keywordPlaceholder')}
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
            />
            {keyword ? (
              <InputGroupButton
                variant="ghost"
                size="icon-sm"
                aria-label={t('clearKeyword')}
                className="text-muted-foreground hover:text-foreground"
                onClick={handleKeywordClear}
              >
                <X className="size-4" />
              </InputGroupButton>
            ) : null}
          </InputGroup>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <Select value={noticeType} onValueChange={onNoticeTypeChange}>
          <SelectTrigger className="h-10 w-full flex-1 rounded-lg border-muted bg-muted/60 sm:w-48">
            <SelectValue placeholder={t('typePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {noticeTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
