'use client';

import { RoleBulkDeleteDialog } from './components/role-bulk-delete-dialog';
import { RoleDataSection } from './components/role-data-section';
import { RoleDeleteDialog } from './components/role-delete-dialog';
import { RoleEditorManager } from './components/role-editor-manager';
import { RoleFiltersSection } from './components/role-filters-section';
import { RoleManagementHeader } from './components/role-management-header';

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
