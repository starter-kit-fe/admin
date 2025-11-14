import { z } from 'zod';

export const profileFormSchema = z.object({
  nickName: z.string().min(1, '请输入昵称'),
  email: z.string().max(120, '邮箱过长').optional(),
  phonenumber: z.string().max(20, '手机号过长').optional(),
  sex: z.enum(['0', '1', '2']),
  remark: z.string().max(200, '备注过长').optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z.string().min(6, '新密码至少 6 位'),
    confirmPassword: z.string().min(6, '请再次输入新密码'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;
