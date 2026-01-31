'use client';

import { MenuDeleteDialog } from './dialogs/menu-delete-dialog';
import { MenuEditorManager } from './editor/menu-editor-manager';
import { MenuManagementFilters } from './filters/menu-management-filters';
import { MenuManagementHeader } from './layout/menu-management-header';
import { MenuTreeSection } from './sections/menu-tree-section';

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
