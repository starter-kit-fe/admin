'use client';

import { Header } from '@/components/dashboard/header';
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
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import { type ReactNode, useEffect, useState } from 'react';

export default function Page({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <RouteProgressBar />
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
