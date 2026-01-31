'use client';

import { OperLogDeleteDialog } from './dialogs/oper-log-delete-dialog';
import { OperLogManagementHeader } from './layout/oper-log-management-header';
import { OperLogDataSection } from './sections/oper-log-data-section';
import { OperLogFiltersSection } from './sections/oper-log-filters-section';

export function OperLogManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <OperLogManagementHeader />
      <OperLogFiltersSection />
      <OperLogDataSection />
      <OperLogDeleteDialog />
    </div>
  );
}
