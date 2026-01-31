'use client';

import { RoleBulkDeleteDialog } from './dialogs/role-bulk-delete-dialog';
import { RoleDeleteDialog } from './dialogs/role-delete-dialog';
import { RoleEditorManager } from './editor/role-editor-manager';
import { RoleManagementHeader } from './layout/role-management-header';
import { RoleDataSection } from './sections/role-data-section';
import { RoleFiltersSection } from './sections/role-filters-section';

export function RoleManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <RoleManagementHeader />
      <RoleFiltersSection />
      <RoleDataSection />
      <RoleEditorManager />
      <RoleDeleteDialog />
      <RoleBulkDeleteDialog />
    </div>
  );
}
