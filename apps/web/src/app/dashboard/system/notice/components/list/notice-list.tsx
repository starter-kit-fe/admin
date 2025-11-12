'use client';

import type { Notice } from '../../type';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Edit2, Trash2 } from 'lucide-react';

interface NoticeListProps {
  records: Notice[];
  loading?: boolean;
  onEdit: (notice: Notice) => void;
  onDelete: (notice: Notice) => void;
}

export function NoticeList({
  records,
  loading = false,
  onEdit,
  onDelete,
}: NoticeListProps) {
  return (
    <Card className="border border-border/60 dark:border-border/40">
      <CardContent className="flex flex-col gap-3 p-0">
        {loading && records.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-sm text-muted-foreground">
            公告加载中...
          </div>
        ) : records.length === 0 ? (
          <Empty className="m-4 h-40 border border-dashed border-border/60">
            <EmptyHeader>
              <EmptyTitle>暂无公告记录</EmptyTitle>
              <EmptyDescription>发布公告后即可在此查看与管理。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          records.map((item) => (
            <article
              key={item.noticeId}
              className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 last:border-b-0"
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    {item.noticeTitle}
                  </h2>
                  <Badge
                    variant={item.noticeType === '2' ? 'secondary' : 'outline'}
                  >
                    {item.noticeType === '2' ? '公告' : '通知'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      item.status === '0'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-600'
                    }
                  >
                    {item.status === '0' ? '正常' : '停用'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => onEdit(item)}
                  >
                    <Edit2 className="size-3.5" />
                    编辑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-destructive hover:text-destructive"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 className="size-3.5" />
                    删除
                  </Button>
                </div>
              </header>
              <p className="text-sm text-muted-foreground">
                {item.noticeContent}
              </p>
              {item.remark ? (
                <p className="text-xs text-muted-foreground">
                  备注：{item.remark}
                </p>
              ) : null}
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
