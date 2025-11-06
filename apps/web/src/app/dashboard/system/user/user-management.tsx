'use client';

import { UserBulkDeleteDialog } from './components/user-bulk-delete-dialog';
import { UserDataSection } from './components/user-data-section';
import { UserDeleteDialog } from './components/user-delete-dialog';
import { UserEditorManager } from './components/user-editor-manager';
import { UserFiltersSection } from './components/user-filters-section';
import { UserManagementHeader } from './components/user-management-header';

export function UserManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <UserManagementHeader />
      <UserFiltersSection />
      <UserDataSection />
      <UserEditorManager />
      <UserDeleteDialog />
      <UserBulkDeleteDialog />
    </div>
  );
}
