'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar, Clock } from 'lucide-react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';

import {
  CRON_PRESETS,
  describeCron,
  formatDateTime,
  getNextExecutionTimes,
} from '../../utils/cron';

interface CronHelperProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type CronFrequency = 'minute' | 'hourly' | 'daily' | 'weekly' | 'monthly';
type CronInputMode = 'builder' | 'manual';

const FREQUENCY_OPTIONS: Array<{
  label: string;
  value: CronFrequency;
  description: string;
}> = [
  { label: '每隔几分钟', value: 'minute', description: '指定分钟间隔执行' },
  {
    label: '每隔几小时',
    value: 'hourly',
    description: '按分钟 + 小时间隔执行',
  },
  { label: '每天固定时间', value: 'daily', description: '每天一次，指定时刻' },
  { label: '每周固定时间', value: 'weekly', description: '选择周几 + 时刻' },
  { label: '每月固定时间', value: 'monthly', description: '指定日期 + 时刻' },
];

const WEEKDAY_OPTIONS = [
  { label: '周一', value: 'MON' },
  { label: '周二', value: 'TUE' },
  { label: '周三', value: 'WED' },
  { label: '周四', value: 'THU' },
  { label: '周五', value: 'FRI' },
  { label: '周六', value: 'SAT' },
  { label: '周日', value: 'SUN' },
] as const;

type CronWeekday = (typeof WEEKDAY_OPTIONS)[number]['value'];

interface CronBuilderState {
  frequency: CronFrequency;
  minuteInterval: number;
  hourInterval: number;
  hourlyMinute: number;
  dailyHour: number;
  dailyMinute: number;
  weeklyHour: number;
  weeklyMinute: number;
  weeklyDays: CronWeekday[];
  monthlyDay: number;
  monthlyHour: number;
  monthlyMinute: number;
}

const DEFAULT_BUILDER_STATE: CronBuilderState = {
  frequency: 'daily',
  minuteInterval: 5,
  hourInterval: 1,
  hourlyMinute: 0,
  dailyHour: 2,
  dailyMinute: 0,
  weeklyHour: 9,
  weeklyMinute: 0,
  weeklyDays: ['MON'],
  monthlyDay: 1,
  monthlyHour: 0,
  monthlyMinute: 0,
};

export function CronHelper({
  value,
  onChange,
  error,
  open,
  onOpenChange,
}: CronHelperProps) {
  const [nextTimes, setNextTimes] = useState<Date[]>([]);
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<CronInputMode>('builder');
  const [builderState, setBuilderState] = useState<CronBuilderState>(
    DEFAULT_BUILDER_STATE,
  );
  const [syncError, setSyncError] = useState(false);
  const lastGeneratedRef = useRef<string | null>(null);

  useEffect(() => {
    if (value?.trim()) {
      setNextTimes(getNextExecutionTimes(value, 3));
      setDescription(describeCron(value));
    } else {
      setNextTimes([]);
      setDescription('');
    }
  }, [value]);

  useEffect(() => {
    if (!value?.trim()) {
      setSyncError(false);
      return;
    }
    if (value === lastGeneratedRef.current) {
      setSyncError(false);
      return;
    }
    const parsed = parseCronExpression(value);
    if (parsed) {
      setBuilderState(parsed);
      setSyncError(false);
    } else {
      setSyncError(true);
    }
  }, [value]);

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      return;
    }
    lastGeneratedRef.current = null;
    onChange(preset);
  };

  const handleManualInput = (event: ChangeEvent<HTMLInputElement>) => {
    lastGeneratedRef.current = null;
    onChange(event.target.value);
  };

  const commitBuilderState = (
    updater: (prev: CronBuilderState) => CronBuilderState,
  ) => {
    setBuilderState((prev) => {
      const next = updater(prev);
      const cron = buildCronExpression(next);
      lastGeneratedRef.current = cron;
      setSyncError(false);
      onChange(cron);
      return next;
    });
  };

  const handleFrequencyChange = (frequency: CronFrequency) => {
    commitBuilderState((prev) => ({ ...prev, frequency }));
  };

  const handleMinuteIntervalChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeNumberInput(
      event.target.value,
      1,
      59,
      builderState.minuteInterval,
    );
    commitBuilderState((prev) => ({ ...prev, minuteInterval: nextValue }));
  };

  const handleHourlyMinuteChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeNumberInput(
      event.target.value,
      0,
      59,
      builderState.hourlyMinute,
    );
    commitBuilderState((prev) => ({ ...prev, hourlyMinute: nextValue }));
  };

  const handleHourIntervalChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeNumberInput(
      event.target.value,
      1,
      24,
      builderState.hourInterval,
    );
    commitBuilderState((prev) => ({ ...prev, hourInterval: nextValue }));
  };

  const handleDailyHourChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeNumberInput(
      event.target.value,
      0,
      23,
      builderState.dailyHour,
    );
    commitBuilderState((prev) => ({ ...prev, dailyHour: nextValue }));
  };

  const handleDailyMinuteChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeNumberInput(
      event.target.value,
      0,
      59,
      builderState.dailyMinute,
    );
    commitBuilderState((prev) => ({ ...prev, dailyMinute: nextValue }));
  };

  const handleWeeklyHourChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeNumberInput(
      event.target.value,
      0,
      23,
      builderState.weeklyHour,
    );
    commitBuilderState((prev) => ({ ...prev, weeklyHour: nextValue }));
  };

  const handleWeeklyMinuteChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeNumberInput(
      event.target.value,
      0,
      59,
      builderState.weeklyMinute,
    );
    commitBuilderState((prev) => ({ ...prev, weeklyMinute: nextValue }));
  };

  const handleWeeklyDaysChange = (days: string[]) => {
    if (!days.length) {
      return;
    }
    const normalized = sortWeekdays(days as CronWeekday[]);
    commitBuilderState((prev) => ({ ...prev, weeklyDays: normalized }));
  };

  const handleMonthlyDayChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeNumberInput(
      event.target.value,
      1,
      31,
      builderState.monthlyDay,
    );
    commitBuilderState((prev) => ({ ...prev, monthlyDay: nextValue }));
  };

  const handleMonthlyHourChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeNumberInput(
      event.target.value,
      0,
      23,
      builderState.monthlyHour,
    );
    commitBuilderState((prev) => ({ ...prev, monthlyHour: nextValue }));
  };

  const handleMonthlyMinuteChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeNumberInput(
      event.target.value,
      0,
      59,
      builderState.monthlyMinute,
    );
    commitBuilderState((prev) => ({ ...prev, monthlyMinute: nextValue }));
  };

  const isPreset = CRON_PRESETS.some((preset) => preset.value === value);

  const renderBuilderFields = () => {
    switch (builderState.frequency) {
      case 'minute':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              按照固定的分钟间隔重复执行任务。
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                min={1}
                max={59}
                value={builderState.minuteInterval}
                onChange={handleMinuteIntervalChange}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                分钟执行一次
              </span>
            </div>
          </div>
        );
      case 'hourly':
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              在指定分钟处按小时间隔执行。
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  每隔
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={builderState.hourInterval}
                  onChange={handleHourIntervalChange}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">小时执行一次</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  执行分钟
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={builderState.hourlyMinute}
                  onChange={handleHourlyMinuteChange}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  在每个小时的该分钟触发
                </p>
              </div>
            </div>
          </div>
        );
      case 'daily':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              每天在固定时间执行。
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                min={0}
                max={23}
                value={builderState.dailyHour}
                onChange={handleDailyHourChange}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">小时</span>
              <Input
                type="number"
                min={0}
                max={59}
                value={builderState.dailyMinute}
                onChange={handleDailyMinuteChange}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">分钟执行</span>
            </div>
          </div>
        );
      case 'weekly':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                执行日期
              </Label>
              <ToggleGroup
                type="multiple"
                value={builderState.weeklyDays}
                onValueChange={handleWeeklyDaysChange}
                className="flex  gap-0.5  w-full overflow-auto"
              >
                {WEEKDAY_OPTIONS.map((day) => (
                  <ToggleGroupItem
                    key={day.value}
                    value={day.value}
                    className="flex-1 items-center justify-center min-w-[90px]"
                  >
                    {day.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                至少选择一个周几，任务会在这些日期触发。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                min={0}
                max={23}
                value={builderState.weeklyHour}
                onChange={handleWeeklyHourChange}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">小时</span>
              <Input
                type="number"
                min={0}
                max={59}
                value={builderState.weeklyMinute}
                onChange={handleWeeklyMinuteChange}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">分钟执行</span>
            </div>
          </div>
        );
      case 'monthly':
        return (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  执行日期
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={builderState.monthlyDay}
                  onChange={handleMonthlyDayChange}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">每月该日期触发</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  执行时间
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={builderState.monthlyHour}
                    onChange={handleMonthlyHourChange}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">小时</span>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={builderState.monthlyMinute}
                    onChange={handleMonthlyMinuteChange}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">分钟</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} modal>
      <ResponsiveDialog.Content className="sm:max-w-3xl">
        <ResponsiveDialog.Header>
          <ResponsiveDialog.Title className="text-left">
            快速生成 Cron 表达式
          </ResponsiveDialog.Title>
          <ResponsiveDialog.Description className="text-left">
            按需选择预设或可视化搭建，自动预览下一次执行时间。
          </ResponsiveDialog.Description>
        </ResponsiveDialog.Header>
        <div className="space-y-4 mt-2">
          <Tabs
            value={activeTab}
            onValueChange={(tab) => tab && setActiveTab(tab as CronInputMode)}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="builder">表达式生成器</TabsTrigger>
              <TabsTrigger value="manual">自定义输入</TabsTrigger>
            </TabsList>
            <TabsContent value="builder" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  执行频率
                </Label>
                <ToggleGroup
                  type="single"
                  value={builderState.frequency}
                  onValueChange={(frequency) =>
                    frequency &&
                    handleFrequencyChange(frequency as CronFrequency)
                  }
                  className="flex flex-wrap gap-2"
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <ToggleGroupItem
                      key={option.value}
                      value={option.value}
                      className="flex-1 min-w-[140px] flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left shadow-none data-[state=on]:border-primary"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {option.label}
                      </span>
                      {/* <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span> */}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div className="space-y-3 rounded-md border p-4">
                {renderBuilderFields()}
                <div className="text-xs text-muted-foreground">
                  当前表达式：
                  <span className="ml-2 font-mono text-sm text-foreground">
                    {value?.trim() || '未设置'}
                  </span>
                </div>
              </div>
              {syncError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    当前表达式较为复杂，生成器无法自动同步。可切换到「自定义输入」重新编辑。
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            <TabsContent value="manual" className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">
                  快速预设
                </Label>
                <Select
                  value={isPreset ? value : 'custom'}
                  onValueChange={handlePresetChange}
                >
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder="选择预设" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">自定义表达式</SelectItem>
                    {CRON_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={value}
                onChange={handleManualInput}
                placeholder="0 0 2 * * ?"
                className={`font-mono ${
                  error
                    ? 'border-destructive focus-visible:ring-destructive/20'
                    : ''
                }`}
              />
              <p className="text-xs text-muted-foreground">
                💡 格式: 秒 分 时 日 月 周 (例如: 0 0 2 * * ? 表示每天凌晨 2 点)
              </p>
            </TabsContent>
          </Tabs>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {(description || nextTimes.length > 0) && (
            <div className="space-y-3 rounded-md bg-muted/50 p-3">
              {description && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="mt-0.5 h-4 w-4 text-blue-500" />
                  <div>
                    <span className="font-medium text-foreground">
                      执行规则:{' '}
                    </span>
                    <span className="text-muted-foreground">{description}</span>
                  </div>
                </div>
              )}

              {nextTimes.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="mt-0.5 h-4 w-4 text-green-500" />
                  <div>
                    <span className="font-medium text-foreground">
                      下次执行:{' '}
                    </span>
                    <div className="mt-1 space-y-1">
                      {nextTimes.map((time, index) => (
                        <div
                          key={index}
                          className="font-mono text-xs text-muted-foreground"
                        >
                          {formatDateTime(time)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <ResponsiveDialog.Footer className="grid grid-cols-[0.4fr_0.6fr] gap-2">
          <Button
            type="button"
            variant="ghost"
            className="bg-muted"
            onClick={() => {
              onChange('');
            }}
          >
            清除表达式
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange?.(false)}
          >
            关闭
          </Button>
        </ResponsiveDialog.Footer>
      </ResponsiveDialog.Content>
    </ResponsiveDialog>
  );
}

function sanitizeNumberInput(
  value: string,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return clampNumber(parsed, min, max);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildCronExpression(state: CronBuilderState): string {
  switch (state.frequency) {
    case 'minute': {
      const interval = clampNumber(state.minuteInterval, 1, 59);
      return `0 */${interval} * * * ?`;
    }
    case 'hourly': {
      const minute = clampNumber(state.hourlyMinute, 0, 59);
      const interval = clampNumber(state.hourInterval, 1, 24);
      const hourField = interval === 1 ? '*' : `*/${interval}`;
      return `0 ${minute} ${hourField} * * ?`;
    }
    case 'daily': {
      const minute = clampNumber(state.dailyMinute, 0, 59);
      const hour = clampNumber(state.dailyHour, 0, 23);
      return `0 ${minute} ${hour} * * ?`;
    }
    case 'weekly': {
      const minute = clampNumber(state.weeklyMinute, 0, 59);
      const hour = clampNumber(state.weeklyHour, 0, 23);
      const days = state.weeklyDays.length
        ? sortWeekdays(state.weeklyDays)
        : DEFAULT_BUILDER_STATE.weeklyDays;
      return `0 ${minute} ${hour} ? * ${days.join(',')}`;
    }
    case 'monthly': {
      const minute = clampNumber(state.monthlyMinute, 0, 59);
      const hour = clampNumber(state.monthlyHour, 0, 23);
      const day = clampNumber(state.monthlyDay, 1, 31);
      return `0 ${minute} ${hour} ${day} * ?`;
    }
    default:
      return assertNever(state.frequency);
  }
}

const WEEKDAY_ORDER: CronWeekday[] = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
];

function sortWeekdays(days: CronWeekday[]): CronWeekday[] {
  const unique = Array.from(new Set(days));
  return unique.sort(
    (a, b) =>
      WEEKDAY_ORDER.indexOf(a as CronWeekday) -
      WEEKDAY_ORDER.indexOf(b as CronWeekday),
  );
}

function parseCronExpression(expression: string): CronBuilderState | null {
  const trimmed = expression.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 6) {
    return null;
  }
  const [second, minute, hour, day, month, weekday] = parts;
  if (second !== '0' || month !== '*') {
    return null;
  }

  const minuteInterval = parseStepField(minute);
  if (
    minuteInterval !== null &&
    (day === '*' || day === '?') &&
    (weekday === '?' || weekday === '*') &&
    hour === '*'
  ) {
    return {
      ...DEFAULT_BUILDER_STATE,
      frequency: 'minute',
      minuteInterval,
    };
  }

  const minuteNumber = parseNumericField(minute, 0, 59);
  if (minuteNumber === null) {
    return null;
  }

  const hourInterval = hour === '*' ? 1 : parseStepField(hour);
  if (
    hourInterval !== null &&
    (day === '*' || day === '?') &&
    (weekday === '?' || weekday === '*')
  ) {
    return {
      ...DEFAULT_BUILDER_STATE,
      frequency: 'hourly',
      hourInterval: hourInterval || 1,
      hourlyMinute: minuteNumber,
    };
  }

  const hourNumber = parseNumericField(hour, 0, 23);
  if (
    hourNumber !== null &&
    day === '*' &&
    (weekday === '?' || weekday === '*')
  ) {
    return {
      ...DEFAULT_BUILDER_STATE,
      frequency: 'daily',
      dailyHour: hourNumber,
      dailyMinute: minuteNumber,
    };
  }

  if (day === '?' && weekday !== '?' && weekday !== '*') {
    const parsedWeekdays = parseWeekdays(weekday);
    if (parsedWeekdays.length && hourNumber !== null) {
      return {
        ...DEFAULT_BUILDER_STATE,
        frequency: 'weekly',
        weeklyHour: hourNumber,
        weeklyMinute: minuteNumber,
        weeklyDays: parsedWeekdays,
      };
    }
  }

  const dayNumber = parseNumericField(day, 1, 31);
  if (dayNumber !== null && weekday === '?') {
    if (hourNumber === null) {
      return null;
    }
    return {
      ...DEFAULT_BUILDER_STATE,
      frequency: 'monthly',
      monthlyDay: dayNumber,
      monthlyHour: hourNumber,
      monthlyMinute: minuteNumber,
    };
  }

  return null;
}

function parseNumericField(
  value: string,
  min: number,
  max: number,
): number | null {
  if (value === '*' || value === '?') {
    return null;
  }
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

function parseStepField(value: string): number | null {
  if (!value.includes('/')) {
    return null;
  }
  const [, step] = value.split('/');
  const parsed = parseInt(step, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

const WEEKDAY_TOKEN_MAP: Record<string, CronWeekday> = {
  '1': 'MON',
  '2': 'TUE',
  '3': 'WED',
  '4': 'THU',
  '5': 'FRI',
  '6': 'SAT',
  '7': 'SUN',
  '0': 'SUN',
  MON: 'MON',
  TUE: 'TUE',
  WED: 'WED',
  THU: 'THU',
  FRI: 'FRI',
  SAT: 'SAT',
  SUN: 'SUN',
};

function parseWeekdays(value: string): CronWeekday[] {
  const tokens = value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  const resolved: CronWeekday[] = [];

  for (const token of tokens) {
    if (token.includes('-')) {
      const [startToken, endToken] = token.split('-');
      const start = WEEKDAY_TOKEN_MAP[startToken.toUpperCase()];
      const end = WEEKDAY_TOKEN_MAP[endToken.toUpperCase()];
      if (start && end) {
        const startIndex = WEEKDAY_ORDER.indexOf(start);
        const endIndex = WEEKDAY_ORDER.indexOf(end);
        if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
          for (let i = startIndex; i <= endIndex; i++) {
            resolved.push(WEEKDAY_ORDER[i]);
          }
        }
      }
      continue;
    }
    const mapped = WEEKDAY_TOKEN_MAP[token.toUpperCase()];
    if (mapped) {
      resolved.push(mapped);
    }
  }

  return sortWeekdays(resolved);
}

function assertNever(value: never): never {
  throw new Error(`Unsupported cron frequency: ${value}`);
}
