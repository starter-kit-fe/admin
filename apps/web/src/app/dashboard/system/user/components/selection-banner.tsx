import { Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SelectionBannerProps {
  count: number;
  onClear: () => void;
  onBulkDelete: () => void;
}

export function SelectionBanner({ count, onClear, onBulkDelete }: SelectionBannerProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-100/70 px-4 py-3 text-sm text-emerald-900">
      <div className="flex items-center gap-2 font-medium">
        <span>{count} 个已选择</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-transparent bg-transparent text-emerald-900 hover:bg-emerald-200"
          onClick={onClear}
        >
          <X className="mr-1 size-4" /> 取消选择
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onBulkDelete}
        >
          <Trash2 className="mr-1 size-4" /> 批量删除
        </Button>
      </div>
    </div>
  );
}
