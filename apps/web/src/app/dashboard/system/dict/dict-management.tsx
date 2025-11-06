'use client';

import { DictManagementHeader } from './components/dict-management-header';
import { DictFiltersSection } from './components/dict-filters-section';
import { DictTypeSection } from './components/dict-type-section';
import { DictDataSection } from './components/dict-data-section';
import { DictTypeEditorManager } from './components/dict-type-editor-manager';
import { DictDataEditorManager } from './components/dict-data-editor-manager';
import { DictTypeDeleteDialog } from './components/dict-type-delete-dialog';
import { DictDataDeleteDialog } from './components/dict-data-delete-dialog';

export function DictManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <DictManagementHeader />
      <DictFiltersSection />
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
