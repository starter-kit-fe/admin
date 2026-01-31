'use client';

import { NoticeBulkDeleteDialog } from './dialogs/notice-bulk-delete-dialog';
import { NoticeDeleteDialog } from './dialogs/notice-delete-dialog';
import { NoticeEditorManager } from './editor/notice-editor-manager';
import { NoticeManagementHeader } from './layout/notice-management-header';
import { NoticeDataSection } from './sections/notice-data-section';
import { NoticeFiltersSection } from './sections/notice-filters-section';

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
