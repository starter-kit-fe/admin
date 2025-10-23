import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type { UserFormValues } from '../type';

const DEFAULT_VALUES: UserFormValues = {
  userName: '',
  nickName: '',
  email: '',
  phonenumber: '',
  sex: '2',
  status: '0',
  deptId: '',
  remark: '',
  password: '',
};

interface UserEditorDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  defaultValues?: UserFormValues;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserFormValues) => void;
}

export function UserEditorDialog({
  mode,
  open,
  defaultValues,
  submitting,
  onOpenChange,
  onSubmit,
}: UserEditorDialogProps) {
  const form = useForm<UserFormValues>({
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? DEFAULT_VALUES);
    }
  }, [open, defaultValues, form]);

  const handleSubmit = form.handleSubmit((values) => {
    if (mode === 'create') {
      if (!values.password || values.password.length < 6) {
        form.setError('password', {
          type: 'manual',
          message: '密码至少 6 位',
        });
        return;
      }
    }
    onSubmit(values);
  });

  const title = mode === 'create' ? '新增用户' : '编辑用户';
  const description =
    mode === 'create'
      ? '创建一个新的系统账号并设置默认密码。'
      : '更新用户的基本信息和状态。';
  const submitText = submitting ? '提交中...' : mode === 'create' ? '创建' : '保存';

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialog.Content className="sm:max-w-xl">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title>{title}</ResponsiveDialog.Title>
          <ResponsiveDialog.Description>{description}</ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <Form {...form}>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="userName"
                  rules={{
                    required: '请输入登录账号',
                    minLength: { value: 2, message: '至少 2 个字符' },
                    maxLength: { value: 30, message: '不超过 30 个字符' },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>登录账号</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入登录账号" autoComplete="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nickName"
                  rules={{ required: '请输入用户昵称' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户昵称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入用户昵称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    validate: (value) => {
                      if (!value) return true;
                      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || '邮箱格式不正确';
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>邮箱</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="可选" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phonenumber"
                  rules={{
                    validate: (value) => {
                      if (!value) return true;
                      return /^1\d{10}$/.test(value) || '请输入 11 位手机号';
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>手机号</FormLabel>
                      <FormControl>
                        <Input placeholder="可选" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deptId"
                  rules={{
                    validate: (value) => {
                      if (!value) return true;
                      return /^\d+$/.test(value) || '部门 ID 需为数字';
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>部门 ID</FormLabel>
                      <FormControl>
                        <Input placeholder="可选，例如 103" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>性别</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value: '0' | '1' | '2') => field.onChange(value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择性别" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">男</SelectItem>
                          <SelectItem value="1">女</SelectItem>
                          <SelectItem value="2">未知</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>账号状态</FormLabel>
                      <Select value={field.value} onValueChange={(value: '0' | '1') => field.onChange(value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择状态" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">启用</SelectItem>
                          <SelectItem value="1">停用</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {mode === 'create' ? (
                  <FormField
                    control={form.control}
                    name="password"
                    rules={{ required: '请输入登录密码', minLength: { value: 6, message: '至少 6 位字符' } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>初始密码</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="至少 6 位" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>

              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[96px] resize-none" placeholder="可选" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ResponsiveDialog.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitText}
                </Button>
              </ResponsiveDialog.Footer>
            </form>
          </Form>
        </div>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}
