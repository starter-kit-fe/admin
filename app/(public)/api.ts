import { request } from '@/lib/request';
export interface versionResponse {
    version: string;
    now: string;
    environment: string;
}
export const getVersion = () => {
    return request<versionResponse>('/version', {
        method: 'GET',
    });
};
