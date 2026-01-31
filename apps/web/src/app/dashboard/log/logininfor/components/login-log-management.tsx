'use client';

import { LoginLogDeleteDialog } from './dialogs/login-log-delete-dialog';
import { LoginLogManagementHeader } from './layout/login-log-management-header';
import { LoginLogDataSection } from './sections/login-log-data-section';
import { LoginLogFiltersSection } from './sections/login-log-filters-section';

export function LoginLogManagement() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 sm:gap-6">
      <LoginLogManagementHeader />
      <LoginLogFiltersSection />
      <LoginLogDataSection />
      <LoginLogDeleteDialog />
    </div>
  );
}
