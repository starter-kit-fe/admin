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
    dictSort: typeof data.dictSort === 'number' ? String(data.dictSort) : '',
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
  type: undefined,
  list: [],
  total: 0,
};

function normalizeField(value: string | null | undefined) {
  return value ?? '';
}

export function areDictDataListsEqual(
  next: DictData[],
  prev: DictData[],
): boolean {
  if (next === prev) {
    return true;
  }
  if (next.length !== prev.length) {
    return false;
  }
  for (let index = 0; index < next.length; index += 1) {
    const a = next[index];
    const b = prev[index];
    if (
      a.id !== b.id ||
      a.dictSort !== b.dictSort ||
      a.dictLabel !== b.dictLabel ||
      a.dictValue !== b.dictValue ||
      a.dictType !== b.dictType ||
      normalizeField(a.status) !== normalizeField(b.status) ||
      normalizeField(a.isDefault) !== normalizeField(b.isDefault) ||
      normalizeField(a.remark) !== normalizeField(b.remark) ||
      normalizeField(a.cssClass) !== normalizeField(b.cssClass) ||
      normalizeField(a.listClass) !== normalizeField(b.listClass)
    ) {
      return false;
    }
  }
  return true;
}
