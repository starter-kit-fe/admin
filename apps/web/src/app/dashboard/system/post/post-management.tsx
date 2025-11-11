'use client';

import { PostBulkDeleteDialog } from './components/dialogs/post-bulk-delete-dialog';
import { PostDeleteDialog } from './components/dialogs/post-delete-dialog';
import { PostEditorManager } from './components/editor/post-editor-manager';
import { PostManagementHeader } from './components/layout/post-management-header';
import { PostDataSection } from './components/sections/post-data-section';
import { PostFiltersSection } from './components/sections/post-filters-section';

export function PostManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <PostManagementHeader />
      <PostFiltersSection />
      <PostDataSection />
      <PostEditorManager />
      <PostDeleteDialog />
      <PostBulkDeleteDialog />
    </div>
  );
}
