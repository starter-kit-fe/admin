import { z } from 'zod';

export type ConfigType = 'Y' | 'N';

export interface SystemConfig {
  configId: number;
  configName: string;
  configKey: string;
  configValue: string;
  configType: ConfigType;
  remark?: string | null;
}

export const configFormSchema = z.object({
  configName: z
    .string()
    .trim()
    .min(1, '请输入参数名称')
    .max(100, '参数名称不能超过 100 个字符'),
  configKey: z
    .string()
    .trim()
    .min(1, '请输入参数键名')
    .max(100, '参数键名不能超过 100 个字符'),
  configValue: z
    .string()
    .trim()
    .min(1, '请输入参数键值')
    .max(500, '参数键值过长'),
  configType: z.enum(['Y', 'N']),
  remark: z
    .string()
    .trim()
    .max(255, '备注不能超过 255 个字符'),
});

export type ConfigFormValues = z.infer<typeof configFormSchema>;
