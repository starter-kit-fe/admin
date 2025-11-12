'use client';

import { OperLogDeleteDialog } from './components/dialogs/oper-log-delete-dialog';
import { OperLogManagementHeader } from './components/layout/oper-log-management-header';
import { OperLogDataSection } from './components/sections/oper-log-data-section';
import { OperLogFiltersSection } from './components/sections/oper-log-filters-section';

export function OperLogManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <OperLogManagementHeader />
      <OperLogFiltersSection />
      <OperLogDataSection />
      <OperLogDeleteDialog />
    </div>
  );
}
