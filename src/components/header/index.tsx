import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Nav from './nav';
// import Actions from "./actions";
export default function Page() {
  const links = [
    { label: '最新资讯', href: '/' },
    { label: '导航', href: '/navigation' },
    { label: '文章', href: '/post' },
    { label: '工具', href: '/tools' },
    { label: '分析', href: '/analysis' },
  ];
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
      <Nav links={links} isMobile={false} />
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">菜单</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <Nav links={links} isMobile={true} />
        </SheetContent>
      </Sheet>
      {/* <Actions /> */}
    </header>
  );
}
