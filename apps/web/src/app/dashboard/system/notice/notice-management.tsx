'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { Edit2, Plus, RefreshCcw, Trash2 } from 'lucide-react';

import { InlineLoading } from '@/components/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { DeleteConfirmDialog } from '../user/components/delete-confirm-dialog';

import {
  createNotice,
  listNotices,
  removeNotice,
  updateNotice,
  type CreateNoticePayload,
  type NoticeListParams,
  type UpdateNoticePayload,
} from './api';
import { NoticeEditorDialog } from './components/notice-editor-dialog';
import type { Notice, NoticeFormValues, NoticeStatus, NoticeType } from './type';

const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: '0', label: '正常' },
  { value: '1', label: '关闭' },
] as const;

const TYPE_TABS = [
  { value: 'all', label: '全部类型' },
  { value: '1', label: '通知' },
  { value: '2', label: '公告' },
] as const;

const NOTICE_TYPE_LABELS: Record<NoticeType, string> = {
  '1': '通知',
  '2': '公告',
};

const NOTICE_STATUS_LABELS: Record<NoticeStatus, string> = {
  '0': '正常',
  '1': '关闭',
};

type StatusValue = (typeof STATUS_TABS)[number]['value'];
type TypeValue = (typeof TYPE_TABS)[number]['value'];

type EditorState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; notice: Notice };

interface DeleteState {
  open: boolean;
  notice?: Notice;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

function toFormValues(notice: Notice): NoticeFormValues {
  return {
    noticeTitle: notice.noticeTitle ?? '',
    noticeType: notice.noticeType ?? '1',
    noticeContent: notice.noticeContent ?? '',
    status: notice.status ?? '0',
    remark: notice.remark ?? '',
  };
}

export function NoticeManagement() {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<StatusValue>('all');
  const [noticeType, setNoticeType] = useState<TypeValue>('all');
  const [titleInput, setTitleInput] = useState('');

  const [editorState, setEditorState] = useState<EditorState>({ open: false });
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });

  const debouncedTitle = useDebouncedValue(titleInput.trim(), 250);

  const queryParams: NoticeListParams = useMemo(
    () => ({
      noticeTitle: debouncedTitle || undefined,
      noticeType: noticeType === 'all' ? undefined : noticeType,
      status: status === 'all' ? undefined : status,
    }),
    [debouncedTitle, noticeType, status],
  );

  const query = useQuery({
    queryKey: ['system', 'notices', queryParams],
    queryFn: () => listNotices(queryParams),
  });

  const notices = query.data ?? [];
  const noticeCount = notices.length;

  const createMutation = useMutation({
    mutationFn: (payload: CreateNoticePayload) => createNotice(payload),
    onSuccess: () => {
      toast.success('新增公告成功');
      queryClient.invalidateQueries({ queryKey: ['system', 'notices'] });
      setEditorState({ open: false });
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '新增公告失败'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateNoticePayload }) =>
      updateNotice(id, payload),
    onSuccess: () => {
      toast.success('公告已更新');
      queryClient.invalidateQueries({ queryKey: ['system', 'notices'] });
      setEditorState({ open: false });
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '更新公告失败'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => removeNotice(id),
    onSuccess: () => {
      toast.success('公告已删除');
      queryClient.invalidateQueries({ queryKey: ['system', 'notices'] });
      setDeleteState({ open: false });
    },
    onError: (error) => {
      toast.error(resolveErrorMessage(error, '删除公告失败'));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: NoticeFormValues) => {
    if (!editorState.open) {
      return;
    }

    const payload: CreateNoticePayload = {
      noticeTitle: values.noticeTitle,
      noticeType: values.noticeType,
      noticeContent: values.noticeContent,
      status: values.status,
      remark: values.remark.trim() ? values.remark.trim() : undefined,
    };

    try {
      if (editorState.mode === 'create') {
        await createMutation.mutateAsync(payload);
      } else {
        await updateMutation.mutateAsync({
          id: editorState.notice.noticeId,
          payload,
        });
      }
    } catch {
      // handled by mutation onError
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-10">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                通知公告
                {noticeCount > 0 ? (
                  <span className="text-sm font-normal text-muted-foreground">
                    {noticeCount} 条
                  </span>
                ) : null}
              </CardTitle>
              <CardDescription>管理平台通知公告，支持分类与状态筛选。</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void query.refetch()}
                disabled={query.isLoading || query.isRefetching}
              >
                {query.isRefetching ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    刷新中
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 size-4" />
                    刷新
                  </>
                )}
              </Button>
              <Button onClick={() => setEditorState({ open: true, mode: 'create' })} disabled={isSubmitting}>
                <Plus className="mr-2 size-4" />
                新增公告
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Tabs value={noticeType} onValueChange={(value) => setNoticeType(value as TypeValue)}>
                <TabsList className="w-full justify-start">
                  {TYPE_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Tabs value={status} onValueChange={(value) => setStatus(value as StatusValue)}>
                <TabsList className="w-full justify-start">
                  {STATUS_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <Input
              placeholder="按标题筛选"
              value={titleInput}
              onChange={(event) => setTitleInput(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <InlineLoading label="加载中" />
            </div>
          ) : query.isError ? (
            <div className="py-10 text-center text-sm text-destructive">
              加载公告失败，请稍后再试。
            </div>
          ) : notices.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              暂无公告，可点击右上角按钮新增。
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((item) => (
                <div
                  key={item.noticeId}
                  className="rounded-xl border border-border/60 bg-background p-4 shadow-sm transition hover:border-border"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold text-foreground">{item.noticeTitle}</span>
                        <Badge variant={item.noticeType === '2' ? 'secondary' : 'outline'}>
                          {NOTICE_TYPE_LABELS[item.noticeType] ?? item.noticeType}
                        </Badge>
                        <Badge variant={item.status === '0' ? 'secondary' : 'outline'}>
                          {NOTICE_STATUS_LABELS[item.status] ?? item.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                        {item.noticeContent}
                      </div>
                      {item.remark ? (
                        <div className="text-xs text-muted-foreground">备注：{item.remark}</div>
                      ) : null}
                    </div>
                    <div className="flex gap-2 md:flex-col">
                      <Button
                        variant="ghost"
                        onClick={() => setEditorState({ open: true, mode: 'edit', notice: item })}
                      >
                        <Edit2 className="mr-1 size-4" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setDeleteState({ open: true, notice: item })}
                      >
                        <Trash2 className="mr-1 size-4" />
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NoticeEditorDialog
        open={editorState.open}
        mode={editorState.open ? editorState.mode : 'create'}
        defaultValues={
          editorState.open && editorState.mode === 'edit'
            ? toFormValues(editorState.notice)
            : undefined
        }
        submitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            setEditorState({ open: false });
          }
        }}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={deleteState.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState({ open: false });
          }
        }}
        title="删除公告"
        description={
          deleteState.notice
            ? `确定要删除公告“${deleteState.notice.noticeTitle}”吗？`
            : '确定要删除该公告吗？'
        }
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteState.notice || deleteMutation.isPending) {
            return;
          }
          deleteMutation.mutate(deleteState.notice.noticeId);
        }}
      />
    </div>
  );
}
