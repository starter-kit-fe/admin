import type { CacheOverview, CacheOverviewPatch } from '../api/type';

export const DEFAULT_OVERVIEW: CacheOverview = {
  server: {},
  clients: {},
  memory: {},
  stats: {},
  persistence: {},
  keyspace: [],
};

export function mergeCacheOverview(
  base: CacheOverview,
  patch?: CacheOverviewPatch | null,
): CacheOverview {
  if (!patch) {
    return base;
  }
  return {
    server: { ...base.server, ...(patch.server ?? {}) },
    clients: { ...base.clients, ...(patch.clients ?? {}) },
    memory: { ...base.memory, ...(patch.memory ?? {}) },
    stats: { ...base.stats, ...(patch.stats ?? {}) },
    persistence: { ...base.persistence, ...(patch.persistence ?? {}) },
    keyspace: patch.keyspace ?? base.keyspace,
  };
}
