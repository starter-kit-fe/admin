'use client';

import { DepartmentDeleteDialog } from './components/department-delete-dialog';
import { DepartmentEditorManager } from './components/department-editor-manager';
import { DepartmentFiltersSection } from './components/department-filters-section';
import { DepartmentManagementHeader } from './components/department-management-header';
import { DepartmentTreeSection } from './components/department-tree-section';

export function DeptManagement() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 pb-10">
      <DepartmentManagementHeader />
      <DepartmentFiltersSection />
      <DepartmentTreeSection />
      <DepartmentEditorManager />
      <DepartmentDeleteDialog />
    </div>
  );
}
