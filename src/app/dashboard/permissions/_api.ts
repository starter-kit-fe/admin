import { IPermissions } from './_types';
import { request } from '@/lib/request';
// 修改
// PUT / lookup / { id }
// 接口ID：233529398
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-233529398
export const put = (id: number, data: IPermissions.postRequest) => {
  return request<string>(`/permissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};
// 获取父节点
// GET / permissions / parent / { type }
// 接口ID：238288252
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-238288252
export const getParent = (val: number) => {
  return request<IPermissions.parentResponse>(`/permissions/parent/${val}`, {
    method: 'GET',
  });
};
// 新增
// POST / permission
// 接口ID：157767109
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-157767109
export const post = (data: IPermissions.postRequest) => {
  return request<string>(`/permissions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 列表
// GET / permissions
// 接口ID：235152432
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-235152432
export const getlist = () => {
  return request<IPermissions.asObject[]>(`/permissions`, {
    method: 'GET',
  });
};
// 更新状态
// PATCH / permissions / status / { id } / { status }
// 接口ID：237452069
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-237452069
export const patch = (id: number, status: number) => {
  return request<IPermissions.asObject[]>(
    `/permissions/status/${id}/${status}`,
    {
      method: 'PATCH',
    }
  );
};
// 删除
// DELETE / permissions / { id }
// 接口ID：237455182
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-237455182
export const del = (id: number) => {
  return request<string>(`/permissions/${id}`, {
    method: 'DELETE',
  });
};

// 详情
// GET / permissions / { id }
// 接口ID：239445023
// 接口地址：https://app.apifox.com/link/project/3200371/apis/api-239445023
export const get = (id: number) => {
  return request<IPermissions.detailResponse>(`/permissions/${id}`, {
    method: 'GET',
  });
};
