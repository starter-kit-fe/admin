import { Loader2 } from 'lucide-react';

export default function Page() {
  return (
    <div className="flex min-h-[10vh] w-full justify-center items-center text-muted-foreground text-sm">
      <Loader2 className="mr-2  animate-spin" /> 加载中...
    </div>
  );
}
