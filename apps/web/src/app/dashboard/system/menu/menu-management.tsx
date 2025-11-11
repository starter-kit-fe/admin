'use client';

import { MenuManagementFilters } from './components/filters/menu-management-filters';
import { MenuManagementHeader } from './components/layout/menu-management-header';
import { MenuTreeSection } from './components/sections/menu-tree-section';
import { MenuDeleteDialog } from './components/dialogs/menu-delete-dialog';
import { MenuEditorManager } from './components/editor/menu-editor-manager';

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
