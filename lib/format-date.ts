/**
 * 格式化日期时间
 * @param dateString 日期字符串
 * @returns 格式化后的日期时间字符串 YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '-';
  }
}

/**
 * 格式化日期
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串 YYYY-MM-DD
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '-';
  }
}

/**
 * 计算相对时间
 * 比如：几分钟前，几小时前，几天前等
 * @param dateString 日期字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    // 小于1分钟
    if (seconds < 60) {
      return '刚刚';
    }
    
    // 小于1小时
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}分钟前`;
    }
    
    // 小于1天
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}小时前`;
    }
    
    // 小于30天
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days}天前`;
    }
    
    // 小于12个月
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months}个月前`;
    }
    
    // 大于等于12个月
    const years = Math.floor(months / 12);
    return `${years}年前`;
  } catch (error) {
    console.error('相对时间格式化错误:', error);
    return '-';
  }
}
