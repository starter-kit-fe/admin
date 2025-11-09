'use client';

import { Card, CardHeader } from '@/components/ui/card';

import { OnlineUserBatchLogoutDialog } from './components/online-batch-logout-dialog';
import { OnlineUserDataSection } from './components/online-data-section';
import { OnlineUserFiltersSection } from './components/online-filters-section';
import { OnlineUserForceLogoutDialog } from './components/online-force-logout-dialog';
import { OnlineUserManagementHeader } from './components/online-management-header';
import { OnlineUserSelectionMeta } from './components/online-selection-meta';

export function OnlineUserManagement() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-4">
          <OnlineUserManagementHeader />
          <OnlineUserFiltersSection />
          <OnlineUserSelectionMeta />
        </CardHeader>
        <OnlineUserDataSection />
      </Card>
      <OnlineUserForceLogoutDialog />
      <OnlineUserBatchLogoutDialog />
    </div>
  );
}
