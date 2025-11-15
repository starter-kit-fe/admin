'use client';

import { DictDataDeleteDialog } from './components/dialogs/dict-data-delete-dialog';
import { DictTypeDeleteDialog } from './components/dialogs/dict-type-delete-dialog';
import { DictDataEditorManager } from './components/editor/dict-data-editor-manager';
import { DictTypeEditorManager } from './components/editor/dict-type-editor-manager';
import { DictManagementHeader } from './components/layout/dict-management-header';
import { DictDataSection } from './components/sections/dict-data-section';
import { DictTypeFiltersSection } from './components/sections/dict-type-filters-section';
import { DictTypeSection } from './components/sections/dict-type-section';

export function DictManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <DictManagementHeader />
      <DictTypeFiltersSection />
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <DictTypeSection />
        <DictDataSection />
      </div>
      <DictTypeEditorManager />
      <DictDataEditorManager />
      <DictTypeDeleteDialog />
      <DictDataDeleteDialog />
    </div>
  );
}
