import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Ellipsis } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeleteDialog from '@/components/delete-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { del } from '@/app/dashboard/permissions/_api';
import { toast } from 'sonner';
import { ID_PERMISSION_LIST } from '@/lib/constant';
import Link from 'next/link';
const useDeletePermissions = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (id: number) => del(id),
    onSuccess(res) {
      if (res === 'ok') {
        toast.success('操作成功');
        queryClient.invalidateQueries({ queryKey: [ID_PERMISSION_LIST] });
        setOpen(false);
      }
    },
  });
  return { mutate, isPending, open, setOpen };
};
interface ActionsProps {
  id: number;
  name: string;
}
export default function Page({ name, id }: ActionsProps) {
  const { mutate, isPending, open, setOpen } = useDeletePermissions();
  return (
    <>
      <DeleteDialog
        open={open}
        title={name}
        loading={isPending}
        onOk={() => mutate(id)}
        onCancel={() => setOpen(false)}
      />
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
          <Link href={`/dashboard/permissions/detail?id=${id}`}>
            <DropdownMenuItem>详情</DropdownMenuItem>
          </Link>
          <Link href={`/dashboard/permissions/edit?id=${id}`}>
            <DropdownMenuItem>编辑</DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            删除
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
