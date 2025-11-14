'use client';

import { MenuDeleteDialog } from './components/dialogs/menu-delete-dialog';
import { MenuEditorManager } from './components/editor/menu-editor-manager';
import { MenuManagementFilters } from './components/filters/menu-management-filters';
import { MenuManagementHeader } from './components/layout/menu-management-header';
import { MenuTreeSection } from './components/sections/menu-tree-section';

export function MenuManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <MenuManagementHeader />
      <MenuManagementFilters />
      <MenuTreeSection />
      <MenuEditorManager />
      <MenuDeleteDialog />
    </div>
  );
}
