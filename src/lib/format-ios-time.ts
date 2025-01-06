import dayjs from 'dayjs';

export const formatISOTime = (time: string, format?: string) => {
  if (!time) return '';
  if (!format) {
    format = 'MM-DD HH:mm';
    // 判断时间是否是今年
    if (dayjs(time).year() !== dayjs().year()) {
      format = `YYYY-${format}`;
    }
  }

  return dayjs(time).format(format);
};

export const toISOTime = (time: string) => {
  if (!time) return '';
  return dayjs(time).toISOString();
};
