import { ILookUP } from './_type';
import { request } from '@/lib/request';
import type { RequestOptions } from '@/lib/request';
import { searchParamsString } from '@/lib/search-params-to-string';
// 查询
// GET / lookup / { id }
// 接口ID：154301956
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-154301956
export const get = (id: string) => {
  return request<ILookUP.asObject>(`/lookup/${id}`, {
    method: 'GET',
  });
};
// 修改
// PUT / lookup / { id }
// 接口ID：233529398
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-233529398
export const put = (id: string, data: ILookUP.putRequest) => {
  return request<string>(`/lookup/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// 删除
// DELETE / lookup / { id }
// 接口ID：233531813
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-233531813
export const del = (id: string) => {
  return request<string>(`/lookup/${id}`, {
    method: 'DELETE',
  });
};

// 新增
// POST / lookup /
// 接口ID：233524300
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-233524300
export const post = (data: ILookUP.postRequest) => {
  return request<string>(`/lookup`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
//   更新状态
//   PATCH /lookup/status/{id}/{status}
//   接口ID：228357874
//   接口地址：https://app.apifox.com/link/project/3200371/apis/api-228357874
export const patchStatus = (id: string, status: string) => {
  return request<boolean>(`/lookup/status/${id}/${status}`, {
    method: 'PATCH',
  });
};
// 目录列表
// GET / lookup / groups
// 接口ID：226466166
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-226466166
export const getGroups = (data: ILookUP.listGroupParam) => {
  return request<ILookUP.listGroupResponse>(
    `/lookup/groups?${searchParamsString(data)}`,
    {
      method: 'GET',
    }
  );
};
// 分组列表
// GET / lookup / group / { key }
// 接口ID：226503169
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-226503169
export const getList = (
  data: ILookUP.listParam,
  options: RequestOptions = {}
) => {
  return request<ILookUP.listResponse>(
    `/lookup/group/${data.value}?${searchParamsString(data)}`,
    {
      method: 'GET',
      ...options,
    }
  );
};
