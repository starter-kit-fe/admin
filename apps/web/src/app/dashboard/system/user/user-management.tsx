'use client';

import { useIsMobile } from '@/hooks/use-mobile';

import { UserBulkDeleteDialog } from './components/dialogs/user-bulk-delete-dialog';
import { UserDeleteDialog } from './components/dialogs/user-delete-dialog';
import { UserResetPasswordDialog } from './components/dialogs/user-reset-password-dialog';
import { UserEditorManager } from './components/editor/user-editor-manager';
import { UserManagementHeader } from './components/layout/user-management-header';
import { UserDataSection } from './components/sections/user-data-section';
import { UserFiltersSection } from './components/sections/user-filters-section';

export function UserManagement() {
  const isMobile = useIsMobile();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 pb-10 sm:gap-6">
      {!isMobile ? <UserManagementHeader /> : null}
      <UserFiltersSection />
      <UserDataSection />
      <UserEditorManager />
      <UserDeleteDialog />
      <UserBulkDeleteDialog />
      <UserResetPasswordDialog />
    </div>
  );
}
