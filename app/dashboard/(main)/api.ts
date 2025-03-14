import { request } from '@/lib/request';


export interface userRoutesResponse {
    alwaysShow: boolean;
    children: route[];
    component: string;
    hidden: boolean;
    meta: routeMeta;
    name: string;
    path: string;
    redirect: string;
    
}

export interface route {
    alwaysShow?: boolean;
    children?: routeChild[];
    component: string;
    hidden: boolean;
    meta: FluffyMeta;
    name: string;
    path: string;
    redirect?: string;
    
}

export interface routeChild {
    component: string;
    hidden: boolean;
    meta: PurpleMeta;
    name: string;
    path: string;
    
}

export interface PurpleMeta {
    icon: string;
    link: string;
    noCache: boolean;
    title: string;
    
}

export interface FluffyMeta {
    icon: string;
    link: string;
    noCache: boolean;
    title: string;
    
}

export interface routeMeta {
    icon: string;
    link: string;
    noCache: boolean;
    title: string;
    
}
//   用户权限
//   GET /user/routes
//   接口ID：271654244
//   接口地址：https://app.apifox.com/link/project/3200371/apis/api-271654244
export function getUserRoutes() {
    return request<userRoutesResponse[]>('/user/routes', {
        method: 'GET',
    })
}