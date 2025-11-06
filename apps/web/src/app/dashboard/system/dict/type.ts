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
  type: DictType;
  items: DictData[];
}

export interface DictTypeFormValues {
  dictName: string;
  dictType: string;
  status: DictStatus;
  remark: string;
}

export interface DictDataFormValues {
  dictLabel: string;
  dictValue: string;
  dictSort: number;
  status: DictStatus;
  isDefault: DictDefaultFlag;
  remark: string;
}
