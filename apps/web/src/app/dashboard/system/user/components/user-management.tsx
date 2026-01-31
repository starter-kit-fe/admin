'use client';

import { UserBulkDeleteDialog } from './dialogs/user-bulk-delete-dialog';
import { UserDeleteDialog } from './dialogs/user-delete-dialog';
import { UserResetPasswordDialog } from './dialogs/user-reset-password-dialog';
import { UserEditorManager } from './editor/user-editor-manager';
import { UserManagementHeader } from './layout/user-management-header';
import { UserDataSection } from './sections/user-data-section';
import { UserFiltersSection } from './sections/user-filters-section';

export function UserManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <UserManagementHeader />
      <UserFiltersSection />
      <UserDataSection />
      <UserEditorManager />
      <UserDeleteDialog />
      <UserBulkDeleteDialog />
      <UserResetPasswordDialog />
    </div>
  );
}
