import { DashboardBreadcrumb } from '@/components/dashboard/breadcrumb';
import { NavUser } from '@/components/dashboard/nav-user';
import { RouteProgressBar } from '@/components/dashboard/route-progress';
import { AppSidebar } from '@/components/dashboard/sidebar';
import ThemeToggle from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import { useEffect, useState } from 'react';

import { SidebarTrigger } from '../ui/sidebar';

export function Header() {
  const { user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  const showNavUser = isHydrated && user;

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12',
        isScrolled
          ? ' bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'
          : ' bg-transparent',
      )}
    >
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
  );
}
