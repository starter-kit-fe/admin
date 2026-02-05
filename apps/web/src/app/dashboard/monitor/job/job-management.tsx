'use client';

import { JobDeleteDialog } from './components/dialogs/job-delete-dialog';
import { JobEditorDialog } from './components/dialogs/job-editor-dialog';
import { JobManagementHeader } from './components/layout/job-management-header';
import { JobDataSection } from './components/sections/job-data-section';
import { JobFiltersSection } from './components/sections/job-filters-section';

export function JobManagement() {
  return (
    <div className="relative mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <div className="pointer-events-none absolute -top-24 left-0 right-0 -z-10 h-64 bg-[radial-gradient(60%_60%_at_0%_0%,rgba(59,130,246,0.12),transparent_60%),radial-gradient(60%_60%_at_100%_100%,rgba(14,165,233,0.08),transparent_60%)]" />
      <JobManagementHeader />
      <JobFiltersSection />
      <JobDataSection />
      <JobDeleteDialog />
      <JobEditorDialog />
    </div>
  );
}
