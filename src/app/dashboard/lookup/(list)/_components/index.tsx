'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import LookupGroups from './groups';
import LookupList from './list';
export default function Page() {
  return (
    <Card>
      <CardHeader>
        <div className="flex">
          <div className="mr-2">头部切换</div>
          <div>新增按钮</div>
        </div>
      </CardHeader>
      <CardContent>
        <div>搜索和新增</div>
        <div className="flex">
          <div>
            <LookupGroups />
          </div>
          <div>
            <LookupList />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
