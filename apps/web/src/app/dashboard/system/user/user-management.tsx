'use client';

import { Plus, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useIsMobile } from '@/hooks/use-mobile';

import {
  useUserManagementRefresh,
  useUserManagementStatus,
  useUserManagementStore,
} from './store';
import { UserBulkDeleteDialog } from './components/user-bulk-delete-dialog';
import { UserDataSection } from './components/user-data-section';
import { UserDeleteDialog } from './components/user-delete-dialog';
import { UserEditorManager } from './components/user-editor-manager';
import { UserFiltersSection } from './components/user-filters-section';
import { UserManagementHeader } from './components/user-management-header';
import { UserResetPasswordDialog } from './components/user-reset-password-dialog';

export function UserManagement() {
  const isMobile = useIsMobile();
  const { openCreate } = useUserManagementStore();
  const { isRefreshing, isMutating } = useUserManagementStatus();
  const refresh = useUserManagementRefresh();
  const refreshDisabled = isRefreshing || isMutating;

  const mobileCreateButton = isMobile ? (
    <Button
      type="button"
      size="sm"
      className="shrink-0 rounded-2xl px-3 font-semibold"
      onClick={() => openCreate()}
      disabled={isMutating}
    >
      <Plus className="mr-1.5 size-4" />
      新增
    </Button>
  ) : undefined;

  const mobileRefreshButton = isMobile ? (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label="刷新用户列表"
      className="size-9 shrink-0 rounded-full border border-border/60 bg-background/70"
      onClick={() => refresh()}
      disabled={refreshDisabled}
    >
      {isRefreshing ? <Spinner className="size-4" /> : <RefreshCcw className="size-4" />}
    </Button>
  ) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 pb-10 sm:gap-6">
      {!isMobile ? <UserManagementHeader /> : null}
      <UserFiltersSection
        variant={isMobile ? 'mobile' : 'panel'}
        actionSlot={mobileCreateButton}
        refreshSlot={mobileRefreshButton}
        titleSlot={
          isMobile ? (
            <span className="text-lg font-semibold text-foreground">用户管理</span>
          ) : undefined
        }
      />
      <UserDataSection />
      <UserEditorManager />
      <UserDeleteDialog />
      <UserBulkDeleteDialog />
      <UserResetPasswordDialog />
    </div>
  );
}
