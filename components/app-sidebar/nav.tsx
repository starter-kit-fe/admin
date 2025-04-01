"use client";

import { ChevronRight, ChevronDown } from "lucide-react";
import * as Icons from "lucide-react"; // 导入所有图标
import { useState } from "react";
import { usePathname } from "next/navigation";
type LucideIconName = keyof typeof Icons;

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useSidebar } from "@/components/ui/sidebar"

import { route, type userRoutesResponse } from "@/api";
import { JSX } from "react";
import { cn } from "@/lib/utils";

// 修改图标组件的获取与渲染方式
// 修改图标组件的获取与渲染方式
const IconComponent = ({ iconName }: { iconName: string }) => {
    // Format the icon name to match Lucide's export format (capitalize first letter)
    const formattedName = iconName.charAt(0).toUpperCase() + iconName.slice(1) as LucideIconName;
    // Use type assertion with safeguard
    const Icon = (Icons[formattedName] || Icons.File) as React.ElementType;
    return <Icon className="h-4 w-4" />;
};

// 处理菜单路径
const getMenuPath = (path: string, parentPath?: string): string => {
  // 处理外部链接
  if (path.startsWith("http")) {
    return path;
  }

  // 处理绝对路径
  if (path.startsWith("/")) {
    return `/dashboard${path}`;
  }

  // 处理相对路径，考虑父路径
  if (parentPath && !parentPath.startsWith("http")) {
    // 移除开头的/dashboard，保留核心路径部分
    const normalizedParentPath = parentPath.replace(/^\/dashboard\/?/, "");
    return `/dashboard/${
      normalizedParentPath ? `${normalizedParentPath}/` : ""
    }${path}`;
  }

  // 默认处理
  return `/dashboard/${path}`;
};

// 渲染菜单项及其子菜单
const renderMenuItems = (items: route[], parentPath?: string): JSX.Element[] => {
    const pathname = usePathname();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return items.filter(item => !item.hidden).map(item => {
        const itemPath = getMenuPath(item.path, parentPath);
        const isActive = pathname === itemPath || pathname.startsWith(`${itemPath}/`);
        
        // For collapsed sidebar with children, use Popover for hover menu
        if (isCollapsed && item.children && item.children.length > 0) {
            return (
                <SidebarMenuItem key={item.name}>
                    <Popover>
                        <PopoverTrigger asChild>
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
                            </SidebarMenuButton>
                        </PopoverTrigger>
                        <PopoverContent 
                            side="right" 
                            align="start" 
                            className="p-2 min-w-52"
                            sideOffset={5}
                        >
                            <div className="flex flex-col gap-1">
                                {item.children.filter(child => !child.hidden).map(child => {
                                    const childPath = getMenuPath(child.path, itemPath);
                                    const isChildActive = pathname === childPath || pathname.startsWith(`${childPath}/`);
                                    
                                    return (
                                        <a 
                                            key={child.name}
                                            href={childPath}
                                            className={cn(
                                                "flex items-center rounded-md p-2 text-sm hover:bg-accent",
                                                isChildActive && "bg-primary/10 text-primary font-medium"
                                            )}
                                        >
                                            {child.meta.icon && (
                                                <span className="w-5 h-5 mr-2 flex items-center justify-center">
                                                    <IconComponent iconName={child.meta.icon} />
                                                </span>
                                            )}
                                            <span>{child.meta.title}</span>
                                        </a>
                                    )
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                </SidebarMenuItem>
            );
        }
        
        // Regular rendering for expanded sidebar or items without children
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
                                {renderMenuItems(item.children, itemPath)}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </Collapsible>
                ) : (
                    <SidebarMenuButton
                        asChild
                        tooltip={item.meta.title}
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

const CollapsibleGroup = ({
    item,
    defaultOpen = true
}: {
    item: userRoutesResponse;
    defaultOpen?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const pathname = usePathname();

    // If sidebar is collapsed, use Popover for hover menu instead
    if (isCollapsed) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <div className="flex items-center cursor-pointer rounded-md transition-colors p-2 hover:bg-accent/50">
                        {item.meta.icon && (
                            <span className="w-5 h-5 flex items-center justify-center text-primary">
                                <IconComponent iconName={item.meta.icon} />
                            </span>
                        )}
                    </div>
                </PopoverTrigger>
                <PopoverContent 
                    side="right" 
                    align="start" 
                    className="p-2 min-w-52"
                    sideOffset={5}
                >
                    <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.meta.title}
                    </div>
                    <div className="flex flex-col gap-1">
                        {item.children && item.children.filter(child => !child.hidden).map(child => {
                            const childPath = getMenuPath(child.path, getMenuPath(item.path));
                            const isChildActive = pathname === childPath || pathname.startsWith(`${childPath}/`);
                            
                            return (
                                <a 
                                    key={child.name}
                                    href={childPath}
                                    className={cn(
                                        "flex items-center rounded-md p-2 text-sm hover:bg-accent",
                                        isChildActive && "bg-primary/10 text-primary font-medium"
                                    )}
                                >
                                    {child.meta.icon && (
                                        <span className="w-5 h-5 mr-2 flex items-center justify-center">
                                            <IconComponent iconName={child.meta.icon} />
                                        </span>
                                    )}
                                    <span>{child.meta.title}</span>
                                </a>
                            )
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full"
        >
            <CollapsibleTrigger asChild>
                <div className="flex items-center cursor-pointer group/label hover:bg-accent/50 rounded-md transition-colors mb-1">
                    <SidebarGroupLabel className="flex-1 select-none cursor-pointer m-0 flex items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.meta.icon && (
                            <span className="w-5 h-5 mr-2 flex items-center justify-center text-primary">
                                <IconComponent iconName={item.meta.icon} />
                            </span>
                        )}
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
                        ? renderMenuItems(item.children, getMenuPath(item.path))
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
      {items
        .filter((it) => !it.hidden)
        .map((item) => (
          <SidebarGroup key={item.name} className="p-0">
            <CollapsibleGroup item={item} />
          </SidebarGroup>
        ))}
    </div>
  );
}
