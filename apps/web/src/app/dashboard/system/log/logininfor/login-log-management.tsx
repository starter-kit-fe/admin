'use client';

import { LoginLogDataSection } from './components/login-log-data-section';
import { LoginLogDeleteDialog } from './components/login-log-delete-dialog';
import { LoginLogFiltersSection } from './components/login-log-filters-section';
import { LoginLogManagementHeader } from './components/login-log-management-header';

export function LoginLogManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <LoginLogManagementHeader />
      <LoginLogFiltersSection />
      <LoginLogDataSection />
      <LoginLogDeleteDialog />
    </div>
  );
}
