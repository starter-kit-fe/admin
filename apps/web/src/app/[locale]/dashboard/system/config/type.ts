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

export const createConfigFormSchema = (
  t: (key: string) => string,
) =>
  z.object({
    configName: z
      .string()
      .trim()
      .min(1, t('form.validation.name.required'))
      .max(100, t('form.validation.name.max')),
    configKey: z
      .string()
      .trim()
      .min(1, t('form.validation.key.required'))
      .max(100, t('form.validation.key.max')),
    configValue: z
      .string()
      .trim()
      .min(1, t('form.validation.value.required'))
      .max(500, t('form.validation.value.max')),
    configType: z.enum(['Y', 'N']),
    remark: z
      .string()
      .trim()
      .max(255, t('form.validation.remark.max')),
  });

export type ConfigFormValues = z.infer<ReturnType<typeof createConfigFormSchema>>;
