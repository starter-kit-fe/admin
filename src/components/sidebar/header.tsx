import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Breadcrumb from './breadcrumb';
// import Actions from "@/components/header/actions";

export default function Page() {
  return (
    <header className="flex h-16 shrink-0 items-center sticky top-0 bg-background justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb />
      </div>
      <div>{/* <Actions /> */}</div>
    </header>
  );
}
