'use client';

import { ConfigDeleteDialog } from './components/dialogs/config-delete-dialog';
import { ConfigEditorManager } from './components/editor/config-editor-manager';
import { ConfigManagementHeader } from './components/layout/config-management-header';
import { ConfigDataSection } from './components/sections/config-data-section';
import { ConfigFiltersSection } from './components/sections/config-filters-section';

export function ConfigManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <ConfigManagementHeader />
      <ConfigFiltersSection />
      <ConfigDataSection />
      <ConfigEditorManager />
      <ConfigDeleteDialog />
    </div>
  );
}
