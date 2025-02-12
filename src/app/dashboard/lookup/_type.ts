export declare namespace ILookUP {
  type asObject = {
    createdAt: string;
    creator: null;
    id: number;
    isActive: boolean;
    isDefault: boolean;
    label: string;
    remark: string;
    sort: number;
    status: number;
    updatedAt: string;
    updator: null;
    value: string;
    group?: string;
  };
  type putRequest = postRequest;
  type postRequest = {
    label: string;
    name: string;
    sort: number;
    remark?: string;
    status: number;
    value: string;
  };
  type listResponse = {
    list: asObject[] | null;
    page: number;
    total: number;
  };
  type listParam = listGroupParam & {
    value: string;
  };
  type listGroupParam = {
    page: string;
    size: string;
    status?: string;
    name: string;
  };
  type listGroupItem = {
    total: string;
    value: string;
  };
  type listGroupResponse = {
    list: listGroupItem[] | null;
    page: number;
    total: number;
  };
}
