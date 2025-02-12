export interface groupRequest {
  endTime?: string;
  name?: string;
  order?: string;
  page?: string;
  size?: string;
  sort?: string;
  startTime?: string;
  status?: string;
}
export interface groupsResponse {
  list: List[];
  page: number;
  total: number;
}
export interface List {
  total: number;
  value: string;
}

export interface listRequest {
  name?: string;
  status?: string;
}

export interface listResponse {
  list: listItem[];
  page: number;
  total: number;
}

export interface listItem {
  createdAt?: string;
  creator?: null;
  id: number;
  isActive?: boolean;
  isDefault?: boolean;
  label?: string;
  remark?: string;
  sort?: number;
  status?: number;
  updatedAt?: string;
  updator?: null;
  value?: string;
}
