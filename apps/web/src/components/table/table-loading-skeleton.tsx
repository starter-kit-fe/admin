import { cn } from '@/lib/utils';

import { Skeleton } from '../ui/skeleton';
import { TableCell, TableRow } from '../ui/table';

type TableLoadingSkeletonProps = {
  columns: number;
  rows?: number;
  className?: string;
  cellClassName?: string;
};

const PLACEHOLDER_WIDTHS = [
  'w-16',
  'w-20',
  'w-24',
  'w-28',
  'w-32',
];

export function TableLoadingSkeleton({
  columns,
  rows = 5,
  className,
  cellClassName,
}: TableLoadingSkeletonProps) {
  const columnCount = Math.max(1, columns);
  const rowCount = Math.max(1, rows);

  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow
          key={rowIndex}
          className={cn('animate-pulse bg-muted/40', className)}
        >
          {Array.from({ length: columnCount }).map((_, colIndex) => {
            const widthClass =
              PLACEHOLDER_WIDTHS[(rowIndex + colIndex) % PLACEHOLDER_WIDTHS.length];
            return (
              <TableCell
                key={`${rowIndex}-${colIndex}`}
                className={cn('h-12 align-middle', cellClassName)}
              >
                <Skeleton className={cn('h-4 rounded-full', widthClass)} />
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}
