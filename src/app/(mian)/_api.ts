import { request } from '@/lib/request';
import { IApp } from './_type';
export const getVersion = () => {
  return request<IApp.Version>('/version', {
    method: 'GET',
  });
};
