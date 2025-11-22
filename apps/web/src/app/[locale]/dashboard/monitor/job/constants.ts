export const BASE_QUERY_KEY = ['monitor', 'jobs'] as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const STATUS_TAB_KEYS = ['all', '0', '1'] as const;

export type JobStatusFilter = (typeof STATUS_TAB_KEYS)[number];

export type JobFilterState = {
  jobName: string;
  jobGroup: string;
  status: JobStatusFilter;
};

export type PaginationState = {
  pageNum: number;
  pageSize: number;
};

export const DEFAULT_FILTERS: JobFilterState = {
  jobName: '',
  jobGroup: '',
  status: 'all',
};

export const DEFAULT_PAGINATION: PaginationState = {
  pageNum: 1,
  pageSize: PAGE_SIZE_OPTIONS[0],
};

export const STATUS_BADGE_VARIANT: Record<
  string,
  'secondary' | 'destructive' | 'outline'
> = {
  '0': 'secondary',
  '1': 'outline',
};

export const PREDEFINED_JOB_TYPES = [
  {
    value: 'db.backup',
    label: '数据库备份',
    description: '定时备份 PostgreSQL 数据库到对象存储',
    defaultCron: '0 0 2 * * ?', // 每天凌晨2点
    defaultGroup: 'BACKUP',
    defaultParams: {
      compress: true,
      uploadToS3: true,
      cleanupOldBackups: true,
      retentionDays: 7,
      tempDir: '/tmp',
      // S3 配置示例(可选,留空则使用服务器配置)
      s3Endpoint: '',
      s3AccessKey: '',
      s3SecretKey: '',
      s3Bucket: '',
      s3Region: 'us-east-1',
      s3UsePathStyle: false,
    },
  },
  {
    value: 'log.cleanup',
    label: '日志清理',
    description: '清理过期的系统日志',
    defaultCron: '0 0 3 * * ?', // 每天凌晨3点
    defaultGroup: 'SYSTEM',
    defaultParams: {
      retentionDays: 30,
    },
  },
  {
    value: 'cache.warmup',
    label: '缓存预热',
    description: '预热常用数据到 Redis 缓存',
    defaultCron: '0 */30 * * * ?', // 每30分钟
    defaultGroup: 'CACHE',
    defaultParams: {},
  },
  {
    value: 'custom',
    label: '自定义任务',
    description: '手动输入调用目标',
    defaultCron: '0 0 * * * ?',
    defaultGroup: 'DEFAULT',
    defaultParams: {},
  },
] as const;

export type PredefinedJobType = (typeof PREDEFINED_JOB_TYPES)[number]['value'];
