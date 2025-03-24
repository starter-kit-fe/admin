import { request } from '@/lib/request'
import { searchParamsString } from '@/lib/search-params-to-string';


export interface lookupGroupResponse {
    list: group[];
    page: number;
    total: number;
}

export interface group {
    total: number;
    value: string;
}
export interface lookupGroupRequest {
    name?: string;
    page?: string,
    size?: string,
    status?: string;
}


// 分组列表
//   GET /lookup/groups
//   接口ID：226466166
//   接口地址：https://app.apifox.com/link/project/3200371/apis/api-226466166
export function getLookupGroups(params: lookupGroupRequest) {
    return request<lookupGroupResponse>(`/lookup/groups?${searchParamsString(params)}`, {
        method: 'GET',
    })
}

export interface lookupResponse {
    list: lookup[];
    page: number;
    total: number;
}

export interface lookup {
    createdAt?: string;
    creator?: null;
    id?: number;
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

export interface lookupRequest {
    name?: string;
    status?: string;
}
// 字典列表
//   GET /lookup/group/{group_value}
//   接口ID：234597593
//   接口地址：https://app.apifox.com/link/project/3200371/apis/api-234597593
export function getLookupList(group_value: string, params: lookupRequest) {
    return request<lookupResponse>(`/lookup/group/${group_value}?${searchParamsString(params)}`, {
        method: 'GET',
    })
}
// 排序
//   PUT /lookup/sort
//   接口ID：275605664
//   接口地址：https://app.apifox.com/link/project/3200371/apis/api-275605664
export function putLookupSort(params: lookupRequest) {
    return request<lookupResponse>(`/lookup/sort`, {
        method: 'PUT',
        body: JSON.stringify(params),
    })
}