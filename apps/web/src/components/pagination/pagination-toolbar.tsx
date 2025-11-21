import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useMemo } from 'react';

interface PaginationToolbarProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: ReadonlyArray<number>;
  disabled?: boolean;
  className?: string;
}

function formatPageSizeOptions(options?: ReadonlyArray<number>) {
  if (!options || options.length === 0) {
    return [];
  }
  return Array.from(new Set(options))
    .filter((item) => Number.isFinite(item) && item > 0)
    .sort((a, b) => a - b);
}

export function PaginationToolbar({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  disabled = false,
  className,
}: PaginationToolbarProps) {
  const safePageSize = pageSize > 0 ? pageSize : 1;

  const { totalPages, displayPage } = useMemo(() => {
    const pages = Math.max(1, Math.ceil(totalItems / safePageSize));
    const display = Math.min(Math.max(currentPage, 1), pages);
    return {
      totalPages: pages,
      displayPage: display,
    };
  }, [currentPage, safePageSize, totalItems]);

  const hasPrevious = displayPage > 1;
  const hasNext = displayPage < totalPages;
  const sizeOptions = formatPageSizeOptions(pageSizeOptions);
  const pageSizeDisabled =
    disabled || !onPageSizeChange || sizeOptions.length === 0;

  const handlePageChange = (page: number) => {
    if (disabled || page === displayPage || page < 1 || page > totalPages) {
      return;
    }
    onPageChange(page);
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="text-muted-foreground">共 {totalItems} 条记录</div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">每页显示</span>
          <Select
            value={String(safePageSize)}
            disabled={pageSizeDisabled}
            onValueChange={(value) => {
              if (onPageSizeChange) {
                const nextSize = Number(value);
                if (
                  !Number.isNaN(nextSize) &&
                  nextSize > 0 &&
                  nextSize !== safePageSize
                ) {
                  onPageSizeChange(nextSize);
                }
              }
            }}
          >
            <SelectTrigger className="h-8 w-[110px]">
              <SelectValue placeholder={`${safePageSize} 条`} />
            </SelectTrigger>
            <SelectContent>
              {(sizeOptions.length > 0 ? sizeOptions : [safePageSize]).map(
                (option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} 条/页
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="text-muted-foreground">
          第 {displayPage} / {totalPages} 页
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="返回首页"
            disabled={disabled || !hasPrevious}
            onClick={() => handlePageChange(1)}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="上一页"
            disabled={disabled || !hasPrevious}
            onClick={() => handlePageChange(displayPage - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="下一页"
            disabled={disabled || !hasNext}
            onClick={() => handlePageChange(displayPage + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="跳转至末页"
            disabled={disabled || !hasNext}
            onClick={() => handlePageChange(totalPages)}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
