/**
 * Cron 表达式工具函数
 * 支持标准 5 位 cron 表达式: 分 时 日 月 周
 * 兼容秒位为 0 的 6 位表达式
 */

export interface CronPreset {
  label: string;
  value: string;
  description: string;
}

export const CRON_PRESETS: CronPreset[] = [
  {
    label: '每分钟',
    value: '* * * * *',
    description: '每分钟执行一次',
  },
  {
    label: '每小时',
    value: '0 * * * *',
    description: '每小时整点执行',
  },
  {
    label: '每天凌晨2点',
    value: '0 2 * * *',
    description: '每天凌晨2点执行',
  },
  {
    label: '每天中午12点',
    value: '0 12 * * *',
    description: '每天中午12点执行',
  },
  {
    label: '每周一凌晨2点',
    value: '0 2 * * MON',
    description: '每周一凌晨2点执行',
  },
  {
    label: '每月1号凌晨2点',
    value: '0 2 1 * *',
    description: '每月1号凌晨2点执行',
  },
  {
    label: '工作日早上9点',
    value: '0 9 * * MON-FRI',
    description: '周一到周五早上9点执行',
  },
];

function normalizeCronParts(expression: string): string[] | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length === 6 && parts[0] === '0') {
    parts.shift();
  }
  if (parts.length !== 5) {
    return null;
  }
  return parts;
}

/**
 * 解析 cron 表达式并计算下次执行时间
 */
export function getNextExecutionTimes(
  cronExpression: string,
  count: number = 3,
): Date[] {
  try {
    const parts = normalizeCronParts(cronExpression);
    if (!parts) {
      return [];
    }

    const [minute, hour, day, month, weekday] = parts;
    const now = new Date();
    const results: Date[] = [];
    let current = new Date(now);

    // 简化实现:只处理常见的 cron 表达式
    // 对于复杂表达式,返回空数组
    for (let i = 0; i < count && results.length < count; i++) {
      const next = getNextExecution(current, {
        minute,
        hour,
        day,
        month,
        weekday,
      });
      if (next) {
        results.push(next);
        current = new Date(next.getTime() + 60 * 1000); // 加1分钟避免重复
      } else {
        break;
      }
    }

    return results;
  } catch {
    return [];
  }
}

interface CronParts {
  minute: string;
  hour: string;
  day: string;
  month: string;
  weekday: string;
}

function getNextExecution(from: Date, parts: CronParts): Date | null {
  const { minute, hour, day, month, weekday } = parts;

  // 从下一分钟开始查找
  const next = new Date(from);
  next.setSeconds(0);
  next.setMilliseconds(0);
  next.setMinutes(next.getMinutes() + 1);

  // 最多查找30天
  const maxIterations = 30 * 24 * 60;
  let iterations = 0;

  while (iterations < maxIterations) {
    const currentHour = next.getHours();
    const currentMinute = next.getMinutes();
    const currentDay = next.getDate();
    const currentMonth = next.getMonth() + 1;
    const currentWeekday = next.getDay();

    const hourMatch = matchField(hour, currentHour, 0, 23);
    const minuteMatch = matchField(minute, currentMinute, 0, 59);
    const dayMatch = matchField(day, currentDay, 1, 31);
    const monthMatch = matchField(month, currentMonth, 1, 12);
    const weekdayMatch = matchWeekday(weekday, currentWeekday);

    if (hourMatch && minuteMatch && dayMatch && monthMatch && weekdayMatch) {
      return next;
    }

    next.setMinutes(next.getMinutes() + 1);
    iterations++;
  }

  return null;
}

function matchField(
  field: string,
  value: number,
  min: number,
  max: number,
): boolean {
  if (field === '*' || field === '?') {
    return true;
  }

  // 处理范围 (e.g., "1-5")
  if (field.includes('-')) {
    const [start, end] = field.split('-').map((s) => parseInt(s, 10));
    if (Number.isNaN(start) || Number.isNaN(end)) {
      return false;
    }
    return value >= start && value <= end;
  }

  // 处理列表 (e.g., "1,3,5")
  if (field.includes(',')) {
    const values = field
      .split(',')
      .map((s) => parseInt(s, 10))
      .filter((num) => !Number.isNaN(num));
    return values.includes(value);
  }

  // 处理步长 (e.g., "*/5")
  if (field.includes('/')) {
    const [base, step] = field.split('/');
    const stepNum = parseInt(step, 10);
    if (Number.isNaN(stepNum) || stepNum <= 0) {
      return false;
    }
    if (base === '*') {
      return value % stepNum === 0;
    }
  }

  const num = parseInt(field, 10);
  if (Number.isNaN(num) || num < min || num > max) {
    return false;
  }
  return num === value;
}

function matchWeekday(field: string, weekday: number): boolean {
  if (field === '*' || field === '?') {
    return true;
  }

  // 转换周日从 0 到 7
  const normalizedWeekday = weekday === 0 ? 7 : weekday;

  // 处理英文缩写
  const weekdayMap: Record<string, number> = {
    SUN: 7,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
  };

  // 处理范围 (e.g., "MON-FRI")
  if (field.includes('-')) {
    const [start, end] = field.split('-');
    const startNum = weekdayMap[start] || parseInt(start, 10);
    const endNum = weekdayMap[end] || parseInt(end, 10);
    return normalizedWeekday >= startNum && normalizedWeekday <= endNum;
  }

  // 处理列表 (e.g., "MON,WED")
  if (field.includes(',')) {
    return field.split(',').some((token) => {
      const normalized = token.trim().toUpperCase();
      const target = weekdayMap[normalized] || parseInt(normalized, 10);
      return normalizedWeekday === target;
    });
  }

  // 处理单个值
  const targetWeekday = weekdayMap[field] || parseInt(field, 10);
  return normalizedWeekday === targetWeekday;
}

/**
 * 生成 cron 表达式的人类可读描述
 */
export function describeCron(cronExpression: string): string {
  const preset = CRON_PRESETS.find((p) => p.value === cronExpression);
  if (preset) {
    return preset.description;
  }

  try {
    const parts = normalizeCronParts(cronExpression);
    if (!parts) {
      return '无效的 Cron 表达式';
    }

    const [minute, hour, day, month, weekday] = parts;
    const descriptions: string[] = [];

    if (minute.includes('/')) {
      const step = minute.split('/')[1];
      descriptions.push(`每 ${step} 分钟`);
    } else if (minute !== '*') {
      descriptions.push(`第 ${minute} 分`);
    }

    if (hour.includes('/')) {
      const step = hour.split('/')[1];
      descriptions.push(`每 ${step} 小时`);
    } else if (hour !== '*') {
      descriptions.push(`${hour} 点`);
    }

    if (day !== '*' && day !== '?') {
      descriptions.push(`${day} 号`);
    }

    if (month !== '*' && month !== '?') {
      descriptions.push(`${month} 月`);
    }

    if (weekday !== '*' && weekday !== '?') {
      const weekdayNames: Record<string, string> = {
        MON: '周一',
        TUE: '周二',
        WED: '周三',
        THU: '周四',
        FRI: '周五',
        SAT: '周六',
        SUN: '周日',
        '1': '周一',
        '2': '周二',
        '3': '周三',
        '4': '周四',
        '5': '周五',
        '6': '周六',
        '7': '周日',
      };
      if (weekday.includes('-')) {
        const [start, end] = weekday.split('-');
        descriptions.push(
          `${weekdayNames[start] || start} 到 ${weekdayNames[end] || end}`,
        );
      } else if (weekday.includes(',')) {
        const labels = weekday
          .split(',')
          .map((token) => weekdayNames[token.trim()] || token.trim())
          .join('、');
        descriptions.push(labels);
      } else {
        descriptions.push(weekdayNames[weekday] || weekday);
      }
    }

    return descriptions.length > 0 ? descriptions.join(' ') : '自定义表达式';
  } catch {
    return '无效的 Cron 表达式';
  }
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
