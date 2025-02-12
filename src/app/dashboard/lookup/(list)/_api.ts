import type {
  groupsResponse,
  groupRequest,
  listRequest,
  listResponse,
} from './_type';
import { request } from '@/lib/request';
import { searchParamsString } from '@/lib/search-params-to-string';

// 目录列表
// GET / lookup / groups
// 接口ID：226466166
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-226466166
export const getGroups = (params: groupRequest) => {
  return request<groupsResponse>(
    `/lookup/groups?${searchParamsString(params)}`,
    {
      method: 'GET',
    }
  );
};
// 分组列表
// GET / lookup / group / { key }
// 接口ID：226503169
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-226503169
export const getList = (value: string, data: listRequest) => {
  return request<listResponse>(
    `/lookup/group/${value}?${searchParamsString(data)}`,
    {
      method: 'GET',
    }
  );
};
