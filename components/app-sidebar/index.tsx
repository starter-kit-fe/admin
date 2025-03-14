"use client"

import * as React from "react"
import { NavMain } from "@/components/app-sidebar/nav"
import { NavUser } from "@/components/app-sidebar/nav-user"
import { TeamSwitcher } from "@/components/app-sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useQuery } from '@tanstack/react-query'
import { ID_USER_ROUTES } from '@/lib/constant'
import { getUserRoutes } from '@/api'
import ShowWithLoading from "../show-with-loading"
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data, isLoading } = useQuery({
    queryKey: [ID_USER_ROUTES],
    queryFn: getUserRoutes,
  })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <ShowWithLoading when={!isLoading}>
          <NavMain items={data!} />
        </ShowWithLoading>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
