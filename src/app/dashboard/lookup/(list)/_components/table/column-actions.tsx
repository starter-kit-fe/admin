import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CellContext } from '@tanstack/react-table';
import { ILookUP } from '../../../_type';
import { Ellipsis } from 'lucide-react';
import { useStore } from '../../../_store';
import { useRouter } from 'next/navigation';

export default function Page({
  row: { row },
}: {
  row: CellContext<ILookUP.asObject, unknown>;
}) {
  const { setCurrentLookup } = useStore();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-6 w-6 p-0 data-[state=open]:bg-muted"
        >
          <Ellipsis className="h-4 w-4" />
          <span className="sr-only">菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[70px]">
        <DropdownMenuItem
          onClick={() => {
            router.push(`/dashboard/lookup/detail?id=${row.original.id}`);
          }}
        >
          详情
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            router.push(`/dashboard/lookup/edit?id=${row.original.id}`);
          }}
        >
          编辑
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setCurrentLookup(row.original)}>
          删除
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
