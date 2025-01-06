// 定义一个通用的大小转换函数
export const convertSize = (
  value: number,
  units: string[],
  base: number
): { value: number; unit: string } => {
  if (value === 0) return { value: 0, unit: units[0] };
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(base)),
    units.length - 1
  );
  return {
    value: value / Math.pow(base, index),
    unit: units[index],
  };
};

// 将字节数转换为易于理解的大小单位
export const bytesToSize = (bytes: number): { value: number; unit: string } => {
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  return convertSize(bytes, units, 1024);
};

// 将数字转换为带有中文单位的字符串
export const numberToChineseUnit = (
  number: number
): { value: number; unit: string } => {
  const units = [
    '',
    '万',
    '十万',
    '百万',
    '千万',
    '亿',
    '十亿',
    '百亿',
    '千亿',
    '万亿',
  ];
  return convertSize(number, units, 10000); // 使用10000作为基数以匹配中文单位
};

// 将字节数转换为格式化的字符串
export const bytesToSizeStr = (bytes: number): string => {
  const { value, unit } = bytesToSize(bytes);
  return `${value.toFixed(2)} ${unit}`;
};

export const numberToSizeStr = (bytes: number): string => {
  const { value, unit } = numberToChineseUnit(bytes);
  return `${Math.ceil(value)} ${unit}`;
};
