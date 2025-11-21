'use client';

import { Header } from '@/components/dashboard/header';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import NextTopLoader from 'nextjs-toploader';
import { type ReactNode } from 'react';

export default function Page({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <NextTopLoader
        color="var(--primary)" // Your primary color
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false} // Set to true to show a spinner
        easing="ease"
        speed={200}
        shadow="0 0 10px var(--primary),0 0 5px var(--primary)" // Optional shadow
      />
      <AppSidebar className="bg-border/35" />
      <SidebarInset className="bg-border/35">
        <Header />
        <section className="app-container mx-auto w-full px-2 py-2 md:px-6 container">
          {children}
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}
