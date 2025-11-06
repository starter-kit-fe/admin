import type {
  DictData,
  DictDataFormValues,
  DictDataList,
  DictType,
  DictTypeFormValues,
} from './type';

export function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

export function toDictTypeFormValues(dict: DictType): DictTypeFormValues {
  return {
    dictName: dict.dictName ?? '',
    dictType: dict.dictType ?? '',
    status: dict.status ?? '0',
    remark: dict.remark ?? '',
  };
}

export function toDictDataFormValues(data: DictData): DictDataFormValues {
  return {
    dictLabel: data.dictLabel ?? '',
    dictValue: data.dictValue ?? '',
    dictSort: data.dictSort ?? 0,
    status: data.status ?? '0',
    isDefault: data.isDefault ?? 'N',
    remark: data.remark ?? '',
  };
}

export function normalizeOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export const emptyDictDataList: DictDataList = {
  items: [],
  total: 0,
};
