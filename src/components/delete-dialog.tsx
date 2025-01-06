import Show from '@/components/show';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
interface deleteDialogProps {
  open: boolean;
  loading: boolean;
  title: string;
  onCancel: () => void;
  onOk: () => void;
}
export default function Page({
  open,
  title,
  loading,
  onCancel,
  onOk,
}: deleteDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>警告</AlertDialogTitle>
          <AlertDialogDescription>
            删除后数据无法找回，请再次确定删除 &quot;{title}&quot;?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onCancel()}>取消</AlertDialogCancel>
          <AlertDialogAction disabled={loading} onClick={() => onOk()}>
            <Show
              when={!loading}
              fallback={<Loader2 className=" animate-spin" />}
            >
              确定
            </Show>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
