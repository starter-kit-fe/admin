"use client";

import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

type SelectionBannerProps = {
  count: number;
  onClear: () => void;
  onBulkDelete: () => void;
};

export function SelectionBanner({
  count,
  onClear,
  onBulkDelete,
}: SelectionBannerProps) {
  const t = useTranslations('SelectionBanner');

  if (count <= 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-100/70 px-4 py-3 text-sm text-emerald-900  dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100">
      <div className="flex items-center gap-2 font-medium">
        <span>{t('count', { count })}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 border-transparent bg-transparent text-emerald-900 hover:bg-emerald-200 focus-visible:ring-emerald-500/40 dark:text-emerald-100 dark:hover:bg-emerald-500/25"
          onClick={onClear}
        >
          <X className="size-4" />
          {t('clear')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive dark:text-destructive dark:hover:bg-destructive/30"
          onClick={onBulkDelete}
        >
          <Trash2 className="size-4" />
          {t('bulkDelete')}
        </Button>
      </div>
    </div>
  );
}
