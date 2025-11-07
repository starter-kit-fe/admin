'use client';

import { OperLogDataSection } from './components/oper-log-data-section';
import { OperLogDeleteDialog } from './components/oper-log-delete-dialog';
import { OperLogFiltersSection } from './components/oper-log-filters-section';
import { OperLogManagementHeader } from './components/oper-log-management-header';

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
