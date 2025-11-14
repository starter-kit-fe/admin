'use client';

import { Header } from '@/components/dashboard/header';
// import { RouteProgressBar } from '@/components/dashboard/route-progress';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { type ReactNode } from 'react';

export default function Page({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      {/* <RouteProgressBar /> */}
      <ProgressBar
        height="4px"
        color="var(--primary)" // 直接用你的 OKLCH 主题变量
        options={{ showSpinner: true, trickleSpeed: 150 }}
        shallowRouting
      />
      <AppSidebar className="bg-border/35" />
      <SidebarInset className="bg-border/35">
        <Header />
        <section className="mx-auto  w-full px-2 py-2 md:px-6 container">
          {children}
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}
