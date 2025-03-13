'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useStore } from '@/app/auth/store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, LogOut, Settings, UserCircle, LayoutDashboard } from 'lucide-react';
import type { userInfoResponse } from '@/app/auth/api';
import Show from '../show';

interface ProfileProps {
  user: userInfoResponse | null;
}

export default function Profile({ user }: ProfileProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const router = useRouter();
  const { logout } = useStore();

  if (!user) return null;

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
    router.push('/');
  };

  return (
    <>
      {/* 移动端视图 */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="size-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
            <Show when={Boolean(user.avatar)} fallback={<User className="size-5 text-primary" />}>
              <Image
                src={user.avatar}
                alt={user.nickName || 'User'}
                width={40}
                height={40}
              />
            </Show>
          </div>
          <div>
            <p className="font-medium">{user.nickName || user.email}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Link href="/profile" className="block">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <UserCircle className="mr-2 size-4" />
              个人资料
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Button>
          </Link>

          <Link href="/dashboard" className="block">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <LayoutDashboard className="mr-2 size-4" />
              控制台
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => setLogoutDialogOpen(true)}
          >
            <LogOut className="mr-2 size-4" />
            退出登录
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </Button>
        </div>
      </div>

      {/* 桌面端视图 */}
      <div className="hidden md:block">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative size-8 p-0 rounded-full"
              aria-label="用户菜单"
            >
              <div className="size-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                <Show when={Boolean(user.avatar)} fallback={<User className="size-4 text-primary" />}>
                  <Image
                    src={user.avatar || 'https://picsum.photos/200/200'}
                    alt={user.nickName || 'User'}
                    width={32}
                    height={32}
                  />
                </Show>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full cursor-pointer">
                  <UserCircle className="mr-2 size-4" />
                  <span>个人资料</span>
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/settings" className="w-full cursor-pointer">
                  <Settings className="mr-2 size-4" />
                  <span>设置</span>
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="w-full cursor-pointer">
                  <LayoutDashboard className="mr-2 size-4" />
                  <span>控制台</span>
                  <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:bg-destructive/10 cursor-pointer"
              onClick={() => {
                setDropdownOpen(false);
                setLogoutDialogOpen(true);
              }}
            >
              <LogOut className="mr-2 size-4" />
              <span>退出登录</span>
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 退出确认对话框 */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认退出</DialogTitle>
            <DialogDescription>
              您确定要退出登录吗？退出后需要重新登录才能访问您的账户。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:space-x-0">
            <Button 
              variant="outline" 
              onClick={() => setLogoutDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLogoutConfirm}
            >
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}