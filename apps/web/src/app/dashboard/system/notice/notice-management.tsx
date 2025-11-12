'use client';

import { NoticeDataSection } from './components/sections/notice-data-section';
import { NoticeDeleteDialog } from './components/dialogs/notice-delete-dialog';
import { NoticeEditorManager } from './components/editor/notice-editor-manager';
import { NoticeFiltersSection } from './components/sections/notice-filters-section';
import { NoticeManagementHeader } from './components/layout/notice-management-header';

export function NoticeManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <NoticeManagementHeader />
      <NoticeFiltersSection />
      <NoticeDataSection />
      <NoticeEditorManager />
      <NoticeDeleteDialog />
    </div>
  );
}
