import type { ConfigFormValues, SystemConfig } from './type';

export function resolveErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  return fallback;
}

export function toFormValues(config: SystemConfig): ConfigFormValues {
  return {
    configName: config.configName ?? '',
    configKey: config.configKey ?? '',
    configValue: config.configValue ?? '',
    configType: (config.configType as 'Y' | 'N') ?? 'N',
    remark: config.remark ?? '',
  };
}
