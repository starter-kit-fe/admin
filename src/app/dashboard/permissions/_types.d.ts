export declare namespace IPermissions {
  type asObject = {
    createdAt: string;
    icon: string;
    id: number;
    isFrame: lookup;
    name: string;
    parentID: number;
    path: string;
    perms: string;
    remark: string;
    sort: number;
    status: lookup;
    type: lookup;
    updatedAt: string;
  };
  type parent = {
    id: number;
    name: string;
  };
  type detailResponse = {
    createdAt: string;
    icon: string;
    id: number;
    isFrame: lookup;
    name: string;
    parent: parent;
    path: string;
    perms: string;
    remark: string;
    sort: number;
    status: lookup;
    type: lookup;
    updatedAt: string;
  };
  type parentResponse = { id: number; name: string }[];
  interface TreeNode extends asObject {
    children?: asObject[];
  }
  type lookup = {
    id: number;
    label: string;
    value: string;
  };
  type postRequest = {
    icon?: string;
    isFrame?: number;
    name: string;
    path?: string;
    perms: string;
    remark?: string;
    sort: number;
    status: number;
    type: number;
    parentId?: number;
  };
}
