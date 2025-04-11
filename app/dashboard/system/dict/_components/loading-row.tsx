import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingRowProps {
  columns: Record<string, boolean>;
}

export function LoadingRow({ columns }: LoadingRowProps) {
  return (
    <TableRow>
      <TableCell className="w-8 p-0"></TableCell>

      {columns.id && (
        <TableCell><Skeleton className="h-4 w-10" /></TableCell>
      )}
      {columns.label && (
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      )}
      {columns.value && (
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      )}
      {columns.sort && (
        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
      )}
      {columns.status && (
        <TableCell><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
      )}
      {columns.isDefault && (
        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      )}
      {columns.remark && (
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      )}
      {columns.createdAt && (
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      )}
      {columns.updatedAt && (
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      )}
      {columns.actions && (
        <TableCell><Skeleton className="h-8 w-16" /></TableCell>
      )}
    </TableRow>
  );
} 