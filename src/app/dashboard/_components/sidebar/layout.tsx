'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Header from './header';
import Logo from './logo';
import Menu, { MenuFooter } from './menu';

// This is sample data.

export default function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* <ResizablePanelGroup direction="horizontal" >
            <ResizablePanel
                minSize={5}
                maxSize={20}
                collapsible={true} > */}
      <Sidebar collapsible="icon" className="border-none">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Logo />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="overflow-hidden">
          <Menu />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              {/* <User /> */}
              <MenuFooter />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        {/* <SidebarRail /> */}
      </Sidebar>
      {/* </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel> */}
      <SidebarInset>
        <Header />
        {children}
      </SidebarInset>
      {/* </ResizablePanel> */}
      {/* </ResizablePanelGroup> */}
    </>
  );
}
