import Link from 'next/link';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { GalleryVerticalEnd } from 'lucide-react';
import pkg from '../../../../../package.json';
import Logo from '@/components/logo';
export default function Page() {
  return (
    <Link href="/dashboard">
      <SidebarMenuButton
        size="lg"
        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
      >
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          {/* <GalleryVerticalEnd className="size-4" /> */}
          <Logo />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-semibold">{pkg.shortName}</span>
          <span className="truncate text-xs text-muted-foreground">
            v{pkg.version}
          </span>
        </div>
      </SidebarMenuButton>
    </Link>
  );
}
