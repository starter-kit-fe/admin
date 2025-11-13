'use client';

import { NoticeBulkDeleteDialog } from './components/dialogs/notice-bulk-delete-dialog';
import { NoticeDeleteDialog } from './components/dialogs/notice-delete-dialog';
import { NoticeEditorManager } from './components/editor/notice-editor-manager';
import { NoticeManagementHeader } from './components/layout/notice-management-header';
import { NoticeDataSection } from './components/sections/notice-data-section';
import { NoticeFiltersSection } from './components/sections/notice-filters-section';

export function NoticeManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <NoticeManagementHeader />
      <NoticeFiltersSection />
      <NoticeDataSection />
      <NoticeEditorManager />
      <NoticeDeleteDialog />
      <NoticeBulkDeleteDialog />
    </div>
  );
}
