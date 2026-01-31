'use client';

import { DepartmentDeleteDialog } from './dialogs/department-delete-dialog';
import { DepartmentEditorManager } from './editor/department-editor-manager';
import { DepartmentManagementHeader } from './layout/department-management-header';
import { DepartmentFiltersSection } from './sections/department-filters-section';
import { DepartmentTreeSection } from './sections/department-tree-section';

export function DeptManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <DepartmentManagementHeader />
      <DepartmentFiltersSection />
      <DepartmentTreeSection />
      <DepartmentEditorManager />
      <DepartmentDeleteDialog />
    </div>
  );
}
