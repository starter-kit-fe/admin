'use client';

import { logout } from '@/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import { useMutation } from '@tanstack/react-query';
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ComponentProps, useCallback } from 'react';
import { toast } from 'sonner';

type UserInfo = {
  name: string;
  email: string;
  avatar: string;
};

type NavUserProps = {
  user: UserInfo;
  variant?: 'sidebar' | 'topbar';
};

type DropdownContentProps = ComponentProps<typeof DropdownMenuContent>;

type UserDropdownContentProps = {
  user: UserInfo;
  contentProps?: DropdownContentProps;
  onLogout: () => void;
  isLoggingOut: boolean;
};

function UserDropdownContent({
  user,
  contentProps,
  onLogout,
  isLoggingOut,
}: UserDropdownContentProps) {
  const { className, ...restContentProps } = contentProps ?? {};

  return (
    <DropdownMenuContent
      className={cn(
        'w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg',
        className,
      )}
      {...restContentProps}
    >
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg">U</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <Sparkles />
          升级专业版
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <BadgeCheck />
          账号设置
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCard />
          账单管理
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Bell />
          通知设置
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          if (!isLoggingOut) {
            onLogout();
          }
        }}
        disabled={isLoggingOut}
      >
        <LogOut />
        {isLoggingOut ? '退出中...' : '退出登录'}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export function NavUser({ user, variant = 'sidebar' }: NavUserProps) {
  const router = useRouter();
  const { setUser, setRoles, setPermissions } = useAuthStore();
  const resetAuthState = useCallback(() => {
    setUser(null);
    setRoles(null);
    setPermissions(null);
    localStorage.removeItem('auth-storage');
  }, [setPermissions, setRoles, setUser]);
  const { mutate: triggerLogout, isPending: isLoggingOut } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      toast.success('已退出登录');
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : '退出登录失败，请稍后重试';
      toast.error(message);
    },
    onSettled: () => {
      resetAuthState();
      router.replace('/login');
    },
  });

  const handleLogout = useCallback(() => {
    if (isLoggingOut) {
      return;
    }
    triggerLogout();
  }, [isLoggingOut, triggerLogout]);

  const { isMobile } = useSidebar();
  const sidebarContentProps: DropdownContentProps = {
    side: isMobile ? 'bottom' : 'right',
    align: 'end',
    sideOffset: 4,
  };

  const topbarContentProps: DropdownContentProps = {
    side: 'bottom',
    align: 'end',
    sideOffset: 6,
  };

  if (variant === 'topbar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary dark:bg-muted/60 dark:text-white/85"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[120px] truncate md:block">
              {user.name}
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <UserDropdownContent
          user={user}
          contentProps={topbarContentProps}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      </DropdownMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">用户</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <UserDropdownContent
            user={user}
            contentProps={sidebarContentProps}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
          />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
