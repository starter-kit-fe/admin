import Link from 'next/link';
import { SidebarMenuButton } from '../ui/sidebar';
import { GalleryVerticalEnd } from 'lucide-react';
export default function Page() {
  return (
    <Link href="/dashboard">
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
      >
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <GalleryVerticalEnd className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">admin template</span>
          <span className="truncate text-xs">Enterprise</span>
        </div>
      </SidebarMenuButton>
    </Link>
  );
}
