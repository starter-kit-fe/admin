import { Suspense } from 'react';

import { UserManagement } from './user-management';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">用户数据加载中...</div>}>
      <UserManagement />
    </Suspense>
  );
}
