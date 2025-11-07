'use client';

import { NoticeDataSection } from './components/notice-data-section';
import { NoticeDeleteDialog } from './components/notice-delete-dialog';
import { NoticeEditorManager } from './components/notice-editor-manager';
import { NoticeFiltersSection } from './components/notice-filters-section';
import { NoticeManagementHeader } from './components/notice-management-header';

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
