import { z } from 'zod';

export type DictStatus = '0' | '1';
export type DictDefaultFlag = 'Y' | 'N';

export interface DictType {
  id: number;
  dictName: string;
  dictType: string;
  status: DictStatus;
  remark?: string | null;
}

export interface DictData {
  id: number;
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
  list: DictData[];
  total: number;
}

export const dictTypeFormSchema = z.object({
  dictName: z
    .string()
    .trim()
    .min(1, '请输入字典名称')
    .max(100, '字典名称不能超过 100 个字符'),
  dictType: z
    .string()
    .trim()
    .min(1, '请输入字典类型')
    .max(100, '字典类型不能超过 100 个字符'),
  status: z.enum(['0', '1']),
  remark: z.string().trim().max(255, '备注不能超过 255 个字符'),
});

export const dictDataFormSchema = z.object({
  dictLabel: z
    .string()
    .trim()
    .min(1, '请输入字典标签')
    .max(100, '字典标签不能超过 100 个字符'),
  dictValue: z
    .string()
    .trim()
    .min(1, '请输入字典键值')
    .max(100, '字典键值不能超过 100 个字符'),
  dictSort: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), '排序需为非负整数'),
  status: z.enum(['0', '1']),
  isDefault: z.enum(['Y', 'N']),
  remark: z.string().trim().max(255, '备注不能超过 255 个字符'),
});

export type DictTypeFormValues = z.infer<typeof dictTypeFormSchema>;
export type DictDataFormValues = z.infer<typeof dictDataFormSchema>;
