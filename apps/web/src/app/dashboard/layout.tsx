'use client';

import { DashboardBreadcrumb } from '@/components/dashboard/breadcrumb';
import { NavUser } from '@/components/dashboard/nav-user';
import { RouteProgressBar } from '@/components/dashboard/route-progress';
import { AppSidebar } from '@/components/dashboard/sidebar';
import ThemeToggle from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores';
import { type ReactNode, useEffect, useState } from 'react';

export default function Page({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const showNavUser = isHydrated && user;

  return (
    <SidebarProvider>
      <RouteProgressBar />
      <AppSidebar className="bg-border/35" />
      <SidebarInset className="bg-border/35">
        <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DashboardBreadcrumb />
          </div>
          <div className="ml-auto flex items-center gap-3 px-4">
            <ThemeToggle />
            {showNavUser ? (
              <NavUser
                user={{
                  name: user?.nickName || user?.userName || '用户',
                  email: user?.email || '未设置邮箱',
                  avatar: user?.avatar || '',
                }}
                variant="topbar"
              />
            ) : null}
          </div>
        </header>
        <main className="px-4 pb-4 pt-2">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
