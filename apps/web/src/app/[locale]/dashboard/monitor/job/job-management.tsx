'use client';

import { JobDeleteDialog } from './components/dialogs/job-delete-dialog';
import { JobManagementHeader } from './components/layout/job-management-header';
import { JobDataSection } from './components/sections/job-data-section';
import { JobFiltersSection } from './components/sections/job-filters-section';

export function JobManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <JobManagementHeader />
      <JobFiltersSection />
      <JobDataSection />
      <JobDeleteDialog />
    </div>
  );
}
