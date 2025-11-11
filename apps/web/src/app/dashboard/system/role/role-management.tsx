'use client';

import { RoleBulkDeleteDialog } from './components/dialogs/role-bulk-delete-dialog';
import { RoleDeleteDialog } from './components/dialogs/role-delete-dialog';
import { RoleEditorManager } from './components/editor/role-editor-manager';
import { RoleManagementHeader } from './components/layout/role-management-header';
import { RoleFiltersSection } from './components/sections/role-filters-section';
import { RoleDataSection } from './components/sections/role-data-section';

export function RoleManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <RoleManagementHeader />
      <RoleFiltersSection />
      <RoleDataSection />
      <RoleEditorManager />
      <RoleDeleteDialog />
      <RoleBulkDeleteDialog />
    </div>
  );
}
