'use client';

import { ConfigManagementHeader } from './components/config-management-header';
import { ConfigFiltersSection } from './components/config-filters-section';
import { ConfigTableSection } from './components/config-table-section';
import { ConfigEditorManager } from './components/config-editor-manager';
import { ConfigDeleteDialog } from './components/config-delete-dialog';

export function ConfigManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <ConfigManagementHeader />
      <ConfigFiltersSection />
      <ConfigTableSection />
      <ConfigEditorManager />
      <ConfigDeleteDialog />
    </div>
  );
}
