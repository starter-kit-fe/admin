'use client';

import { ConfigBulkDeleteDialog } from './dialogs/config-bulk-delete-dialog';
import { ConfigDeleteDialog } from './dialogs/config-delete-dialog';
import { ConfigEditorManager } from './editor/config-editor-manager';
import { ConfigManagementHeader } from './layout/config-management-header';
import { ConfigDataSection } from './sections/config-data-section';
import { ConfigFiltersSection } from './sections/config-filters-section';

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
