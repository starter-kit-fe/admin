'use client';

import { PostBulkDeleteDialog } from './components/post-bulk-delete-dialog';
import { PostDataSection } from './components/post-data-section';
import { PostDeleteDialog } from './components/post-delete-dialog';
import { PostEditorManager } from './components/post-editor-manager';
import { PostFiltersSection } from './components/post-filters-section';
import { PostManagementHeader } from './components/post-management-header';

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
