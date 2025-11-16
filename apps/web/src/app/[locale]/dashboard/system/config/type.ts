export type ConfigType = 'Y' | 'N';

export interface SystemConfig {
  configId: number;
  configName: string;
  configKey: string;
  configValue: string;
  configType: ConfigType;
  remark?: string | null;
}

export interface ConfigFormValues {
  configName: string;
  configKey: string;
  configValue: string;
  configType: ConfigType;
  remark: string;
}
