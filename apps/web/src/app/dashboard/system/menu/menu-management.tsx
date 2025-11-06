'use client';

import { MenuManagementFilters } from './components/menu-management-filters';
import { MenuManagementHeader } from './components/menu-management-header';
import { MenuTreeSection } from './components/menu-tree-section';
import { MenuDeleteDialog } from './components/menu-delete-dialog';
import { MenuEditorManager } from './components/menu-editor-manager';

export function MenuManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 pb-10">
      <MenuManagementHeader />
      <MenuManagementFilters />
      <MenuTreeSection />
      <MenuEditorManager />
      <MenuDeleteDialog />
    </div>
  );
}
