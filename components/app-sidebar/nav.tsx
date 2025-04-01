"use client"

import { ChevronRight, ChevronDown } from "lucide-react"
import * as Icons from "lucide-react" // 导入所有图标
import { useState } from "react"
import { usePathname } from "next/navigation"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
} from "@/components/ui/sidebar"
import { route, type userRoutesResponse, } from '@/api'
import { JSX } from "react"
import { cn } from "@/lib/utils"

// 修改图标组件的获取与渲染方式
const IconComponent = ({ iconName }: { iconName: string }) => {
    const formattedName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    const Icon = (Icons as any)[formattedName] || Icons.File;
    return <Icon className="h-4 w-4" />;
};

// 处理菜单路径
const getMenuPath = (path: string): string => {
    if (path.startsWith('http')) {
        return path;
    }
    // 如果以/开头，直接返回/dashboard + path
    if (path.startsWith('/')) {
        return `/dashboard${path}`;
    }
    // 否则加上/dashboard/
    return `/dashboard/${path}`;
};

// 渲染菜单项及其子菜单
const renderMenuItems = (items: route[]): JSX.Element[] => {
    const pathname = usePathname();

    return items.filter(item => !item.hidden).map(item => {
        const itemPath = getMenuPath(item.path);
        const isActive = pathname === itemPath || pathname.startsWith(`${itemPath}/`);
        return (
            <SidebarMenuItem key={item.name}>
                {item.children && item.children.length > 0 ? (
                    <Collapsible className="group/collapsible" defaultOpen={isActive}>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                tooltip={item.meta.title}
                                className={cn(
                                    "transition-colors",
                                    isActive && "bg-primary/10 text-primary font-medium"
                                )}
                            >
                                {item.meta.icon && (
                                    <span className="w-5 h-5 mr-2 flex items-center justify-center">
                                        <IconComponent iconName={item.meta.icon} />
                                    </span>
                                )}
                                <span>{item.meta.title}</span>
                                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {renderMenuItems(item.children)}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </Collapsible>
                ) : (
                    <SidebarMenuButton
                        asChild
                        className={cn(
                            "transition-colors",
                            isActive && "bg-primary/10 text-primary font-medium"
                        )}
                    >
                        <a href={itemPath}>
                            {item.meta.icon && (
                                <span className="w-5 h-5 mr-2 flex items-center justify-center">
                                    <IconComponent iconName={item.meta.icon} />
                                </span>
                            )}
                            <span>{item.meta.title}</span>
                        </a>
                    </SidebarMenuButton>
                )}
            </SidebarMenuItem>
        );
    });
};

// 可折叠分组组件
const CollapsibleGroup = ({
    item,
    defaultOpen = true
}: {
    item: userRoutesResponse;
    defaultOpen?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full"
        >
            <CollapsibleTrigger asChild>
                <div className="flex items-center cursor-pointer group/label hover:bg-accent/50 rounded-md transition-colors mb-1">
                    <SidebarGroupLabel className="flex-1 select-none cursor-pointer m-0 flex items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {/* {item.meta.icon && (
                            <span className="w-5 h-5 mr-2 flex items-center justify-center text-primary">
                                <IconComponent iconName={item.meta.icon} />
                            </span>
                        )} */}
                        <span>{item.meta.title}</span>
                    </SidebarGroupLabel>
                    <span className="opacity-60 group-hover/label:opacity-100 transition-opacity">
                        {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                    </span>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <SidebarMenu className="pl-2 border-l-[1px] border-border ml-4">
                    {item.children && item.children.length > 0
                        ? renderMenuItems(item.children)
                        : (
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    className="text-sm py-1.5"
                                >
                                    <a href={getMenuPath(item.path)}>
                                        {item.meta.icon && (
                                            <span className="w-5 h-5 mr-2 flex items-center justify-center">
                                                <IconComponent iconName={item.meta.icon} />
                                            </span>
                                        )}
                                        <span>{item.meta.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    }
                </SidebarMenu>
            </CollapsibleContent>
        </Collapsible>
    );
};

export function NavMain({ items }: { items: userRoutesResponse[] }) {
    // 过滤掉隐藏菜单
    return (
        <div className="px-2 py-2">
            {items.filter(it => !it.hidden).map((item) => (
                <SidebarGroup key={item.name} className="p-0" >
                    <CollapsibleGroup item={item} />
                </SidebarGroup>
            ))}
        </div>
    )
}