'use client';

import { DictDataDeleteDialog } from './dialogs/dict-data-delete-dialog';
import { DictTypeDeleteDialog } from './dialogs/dict-type-delete-dialog';
import { DictDataEditorManager } from './editor/dict-data-editor-manager';
import { DictTypeEditorManager } from './editor/dict-type-editor-manager';
import { DictManagementHeader } from './layout/dict-management-header';
import { DictDataSection } from './sections/dict-data-section';
import { DictTypeFiltersSection } from './sections/dict-type-filters-section';
import { DictTypeSection } from './sections/dict-type-section';

export function DictManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <DictManagementHeader />
      <DictTypeFiltersSection />
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
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
