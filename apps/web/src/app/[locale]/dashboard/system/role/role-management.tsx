'use client';

import { RoleBulkDeleteDialog } from './components/dialogs/role-bulk-delete-dialog';
import { RoleDeleteDialog } from './components/dialogs/role-delete-dialog';
import { RoleEditorManager } from './components/editor/role-editor-manager';
import { RoleManagementHeader } from './components/layout/role-management-header';
import { RoleDataSection } from './components/sections/role-data-section';
import { RoleFiltersSection } from './components/sections/role-filters-section';

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
