'use client';

import { JobDeleteDialog } from './components/dialogs/job-delete-dialog';
import { JobManagementHeader } from './components/layout/job-management-header';
import { JobDataSection } from './components/sections/job-data-section';
import { JobFiltersSection } from './components/sections/job-filters-section';

export function JobManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <JobManagementHeader />
      <JobFiltersSection />
      <JobDataSection />
      <JobDeleteDialog />
    </div>
  );
}
