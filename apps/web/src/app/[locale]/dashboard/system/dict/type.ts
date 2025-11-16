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

export const buildDictTypeFormSchema = (
  t: (path: string) => string,
) =>
  z.object({
    dictName: z
      .string()
      .trim()
      .min(1, t('validation.dictName.required'))
      .max(100, t('validation.dictName.max')),
    dictType: z
      .string()
      .trim()
      .min(1, t('validation.dictType.required'))
      .max(100, t('validation.dictType.max')),
    status: z.enum(['0', '1']),
    remark: z.string().trim().max(255, t('validation.remark.max')),
  });

export const buildDictDataFormSchema = (
  t: (path: string) => string,
) =>
  z.object({
    dictLabel: z
      .string()
      .trim()
      .min(1, t('validation.dictLabel.required'))
      .max(100, t('validation.dictLabel.max')),
    dictValue: z
      .string()
      .trim()
      .min(1, t('validation.dictValue.required'))
      .max(100, t('validation.dictValue.max')),
    dictSort: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^\d+$/.test(value),
        t('validation.dictSort.invalid'),
      ),
    status: z.enum(['0', '1']),
    isDefault: z.enum(['Y', 'N']),
    remark: z.string().trim().max(255, t('validation.remark.max')),
  });

export interface DictTypeFormValues {
  dictName: string;
  dictType: string;
  status: DictStatus;
  remark: string;
}

export interface DictDataFormValues {
  dictLabel: string;
  dictValue: string;
  dictSort: string;
  status: DictStatus;
  isDefault: DictDefaultFlag;
  remark: string;
}
