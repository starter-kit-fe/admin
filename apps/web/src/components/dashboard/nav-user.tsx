'use client';

import { logout } from '@/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useRouter } from '@/i18n/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ComponentProps, useCallback, useState } from 'react';
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
  onRequestLogout: () => void;
  isLoggingOut: boolean;
  onNavigateProfile: () => void;
};

function UserDropdownContent({
  user,
  contentProps,
  onRequestLogout,
  isLoggingOut,
  onNavigateProfile,
}: UserDropdownContentProps) {
  const { className, ...restContentProps } = contentProps ?? {};
  const t = useTranslations('NavUser');

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
            <AvatarFallback className="rounded-lg">
              {t('avatarFallback')}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
        </div>
      </DropdownMenuLabel>
      {/* <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <Sparkles />
          升级专业版
        </DropdownMenuItem>
      </DropdownMenuGroup> */}
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            onNavigateProfile();
          }}
        >
          <BadgeCheck />
          {t('menu.settings')}
        </DropdownMenuItem>
        {/* <DropdownMenuItem>
          <CreditCard />
          账单管理
        </DropdownMenuItem> */}
        {/* <DropdownMenuItem>
          <Bell />
          通知设置
        </DropdownMenuItem> */}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          if (!isLoggingOut) {
            onRequestLogout();
          }
        }}
        disabled={isLoggingOut}
      >
        <LogOut />
        {isLoggingOut ? t('menu.loggingOut') : t('menu.logout')}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export function NavUser({ user, variant = 'sidebar' }: NavUserProps) {
  const t = useTranslations('NavUser');
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
      toast.success(t('toast.logoutSuccess'));
    },
    onError: (error: unknown) => {
      const fallback = t('toast.logoutError');
      const message = error instanceof Error ? error.message : fallback;
      toast.error(message || fallback);
    },
    onSettled: () => {
      resetAuthState();
      router.replace('/login');
    },
  });

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleLogoutRequest = useCallback(() => {
    if (isLoggingOut) {
      return;
    }
    setIsLogoutDialogOpen(true);
  }, [isLoggingOut, setIsLogoutDialogOpen]);

  const handleConfirmLogout = useCallback(() => {
    if (isLoggingOut) {
      return;
    }
    setIsLogoutDialogOpen(false);
    triggerLogout();
  }, [isLoggingOut, setIsLogoutDialogOpen, triggerLogout]);

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

  const logoutConfirmationDialog = (
    <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('dialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('dialog.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoggingOut}>
            {t('dialog.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? t('dialog.confirming') : t('dialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === 'topbar') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary dark:bg-muted/60 dark:text-white/85"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name ? user.name.charAt(0) : t('avatarFallback')}
                </AvatarFallback>
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
            onRequestLogout={handleLogoutRequest}
            isLoggingOut={isLoggingOut}
            onNavigateProfile={() => router.push('/dashboard/profile')}
          />
        </DropdownMenu>
        {logoutConfirmationDialog}
      </>
    );
  }

  return (
    <>
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
                  <AvatarFallback className="rounded-lg">
                    {t('avatarFallback')}
                  </AvatarFallback>
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
              onRequestLogout={handleLogoutRequest}
              isLoggingOut={isLoggingOut}
              onNavigateProfile={() => router.push('/dashboard/profile')}
            />
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {logoutConfirmationDialog}
    </>
  );
}
