'use client';

import { PostBulkDeleteDialog } from './dialogs/post-bulk-delete-dialog';
import { PostDeleteDialog } from './dialogs/post-delete-dialog';
import { PostEditorManager } from './editor/post-editor-manager';
import { PostManagementHeader } from './layout/post-management-header';
import { PostDataSection } from './sections/post-data-section';
import { PostFiltersSection } from './sections/post-filters-section';

export function PostManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <PostManagementHeader />
      <PostFiltersSection />
      <PostDataSection />
      <PostEditorManager />
      <PostDeleteDialog />
      <PostBulkDeleteDialog />
    </div>
  );
}
