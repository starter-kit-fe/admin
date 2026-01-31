import { Suspense } from 'react';

import { UserManagement } from './components/user-management';

export default function Page() {
  return (
    <Suspense>
      <UserManagement />
    </Suspense>
  );
}
