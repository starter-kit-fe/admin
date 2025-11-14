import { get } from '@/lib/request';
import { HealthRecord } from '@/types';

export function gethealthz() {
  return get<HealthRecord>('/healthz');
}
