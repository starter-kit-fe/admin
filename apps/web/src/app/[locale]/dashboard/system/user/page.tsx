import { Suspense } from 'react';

import { UserManagement } from './user-management';
import { UserManagementFallback } from './components/user-management-fallback';

export default function Page() {
  return (
    <Suspense fallback={<UserManagementFallback />}>
      <UserManagement />
    </Suspense>
  );
}
