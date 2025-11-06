import { get } from '@/lib/request';

import type { ServerStatus } from './type';

export function getServerStatus() {
  return get<ServerStatus>('/v1/monitor/server');
}
