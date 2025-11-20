import { Suspense } from 'react';

import { UserManagement } from './user-management';

export default function Page() {
  return (
    <Suspense>
      <UserManagement />
    </Suspense>
  );
}
