'use client';

import { DepartmentDeleteDialog } from './components/dialogs/department-delete-dialog';
import { DepartmentEditorManager } from './components/editor/department-editor-manager';
import { DepartmentManagementHeader } from './components/layout/department-management-header';
import { DepartmentFiltersSection } from './components/sections/department-filters-section';
import { DepartmentTreeSection } from './components/sections/department-tree-section';

export function DeptManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-4 px-3">
      <DepartmentManagementHeader />
      <DepartmentFiltersSection />
      <DepartmentTreeSection />
      <DepartmentEditorManager />
      <DepartmentDeleteDialog />
    </div>
  );
}
