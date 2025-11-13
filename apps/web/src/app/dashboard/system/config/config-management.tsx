'use client';

import { ConfigBulkDeleteDialog } from './components/dialogs/config-bulk-delete-dialog';
import { ConfigDeleteDialog } from './components/dialogs/config-delete-dialog';
import { ConfigEditorManager } from './components/editor/config-editor-manager';
import { ConfigManagementHeader } from './components/layout/config-management-header';
import { ConfigDataSection } from './components/sections/config-data-section';
import { ConfigFiltersSection } from './components/sections/config-filters-section';

export function ConfigManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <ConfigManagementHeader />
      <ConfigFiltersSection />
      <ConfigDataSection />
      <ConfigEditorManager />
      <ConfigBulkDeleteDialog />
      <ConfigDeleteDialog />
    </div>
  );
}
