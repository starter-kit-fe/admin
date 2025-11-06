'use client';

export interface CacheServerInfo {
  version?: string;
  mode?: string;
  role?: string;
  os?: string;
  processId?: number;
  uptimeSeconds?: number;
  uptime?: string;
  connectedSlaves?: number;
}

export interface CacheClientsInfo {
  connected?: number;
  blocked?: number;
}

export interface CacheMemoryInfo {
  usedMemory?: number;
  usedMemoryHuman?: string;
  usedMemoryPeak?: number;
  usedMemoryPeakHuman?: string;
  maxMemory?: number;
  maxMemoryHuman?: string;
  fragmentationRatio?: number;
}

export interface CacheStatsInfo {
  totalConnections?: number;
  totalCommandsProcessed?: number;
  instantaneousOps?: number;
  keyspaceHits?: number;
  keyspaceMisses?: number;
  hitRate?: number;
  rejectedConnections?: number;
  expiredKeys?: number;
  evictedKeys?: number;
}

export interface CachePersistenceInfo {
  rdbLastSaveTime?: string;
  rdbLastStatus?: string;
  rdbChangesSinceLastSave?: number;
  aofEnabled?: boolean;
}

export interface CacheKeyspaceInfo {
  db: string;
  keys: number;
  expires: number;
  avgTtl: number;
}

export interface CacheOverview {
  server: CacheServerInfo;
  clients: CacheClientsInfo;
  memory: CacheMemoryInfo;
  stats: CacheStatsInfo;
  persistence: CachePersistenceInfo;
  keyspace: CacheKeyspaceInfo[];
}

export interface CacheKeyItem {
  key: string;
  type?: string;
  ttlSeconds?: number;
  ttl?: string;
  sizeBytes?: number;
  encoding?: string;
  idleSeconds?: number;
}

export interface CacheKeyListResponse {
  items: CacheKeyItem[];
  total: number;
  pageNum: number;
  pageSize: number;
  pattern: string;
  hasMore: boolean;
  scanned: number;
  limited: boolean;
}
