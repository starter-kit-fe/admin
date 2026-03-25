import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@repo/ui/components/empty';
import { TableCell, TableRow } from '@repo/ui/components/table';

interface TableEmptyStateProps {
  colSpan: number;
  title: string;
  description?: string;
}

export function TableEmptyState({
  colSpan,
  title,
  description,
}: TableEmptyStateProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-48 text-center align-middle"
      >
        <Empty className="border-0 bg-transparent p-4">
          <EmptyHeader>
            <EmptyTitle>{title}</EmptyTitle>
            {description ? (
              <EmptyDescription>{description}</EmptyDescription>
            ) : null}
          </EmptyHeader>
        </Empty>
      </TableCell>
    </TableRow>
  );
}
