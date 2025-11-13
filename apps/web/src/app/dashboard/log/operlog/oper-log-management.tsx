'use client';

import { OperLogDeleteDialog } from './components/dialogs/oper-log-delete-dialog';
import { OperLogManagementHeader } from './components/layout/oper-log-management-header';
import { OperLogDataSection } from './components/sections/oper-log-data-section';
import { OperLogFiltersSection } from './components/sections/oper-log-filters-section';

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
