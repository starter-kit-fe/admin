import { z } from 'zod';

export type DictStatus = '0' | '1';
export type DictDefaultFlag = 'Y' | 'N';

export interface DictType {
  dictId: number;
  dictName: string;
  dictType: string;
  status: DictStatus;
  remark?: string | null;
}

export interface DictData {
  dictCode: number;
  dictSort: number;
  dictLabel: string;
  dictValue: string;
  dictType: string;
  status: DictStatus;
  isDefault: DictDefaultFlag;
  remark?: string | null;
  listClass?: string | null;
  cssClass?: string | null;
}

export interface DictDataList {
  type?: DictType;
  items: DictData[];
  total: number;
}

export const createDictTypeFormSchema = (t: (key: string) => string) =>
  z.object({
    dictName: z
      .string()
      .trim()
      .min(1, t('typeEditor.validation.dictName.required'))
      .max(100, t('typeEditor.validation.dictName.max')),
    dictType: z
      .string()
      .trim()
      .min(1, t('typeEditor.validation.dictType.required'))
      .max(100, t('typeEditor.validation.dictType.max')),
    status: z.enum(['0', '1']),
    remark: z.string().trim().max(255, t('typeEditor.validation.remark.max')),
  });

export const createDictDataFormSchema = (t: (key: string) => string) =>
  z.object({
    dictLabel: z
      .string()
      .trim()
      .min(1, t('dataEditor.validation.dictLabel.required'))
      .max(100, t('dataEditor.validation.dictLabel.max')),
    dictValue: z
      .string()
      .trim()
      .min(1, t('dataEditor.validation.dictValue.required'))
      .max(100, t('dataEditor.validation.dictValue.max')),
    dictSort: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^\d+$/.test(value),
        t('dataEditor.validation.dictSort.invalid'),
      ),
    status: z.enum(['0', '1']),
    isDefault: z.enum(['Y', 'N']),
    remark: z
      .string()
      .trim()
      .max(255, t('dataEditor.validation.remark.max')),
  });

export type DictTypeFormValues = z.infer<ReturnType<typeof createDictTypeFormSchema>>;
export type DictDataFormValues = z.infer<ReturnType<typeof createDictDataFormSchema>>;
