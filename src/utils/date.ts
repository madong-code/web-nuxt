import dayjs from 'dayjs'
import utcPlugin from 'dayjs/plugin/utc'
import timezonePlugin from 'dayjs/plugin/timezone'
import relativeTimePlugin from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 注册插件
dayjs.extend(utcPlugin)
dayjs.extend(timezonePlugin)
dayjs.extend(relativeTimePlugin)

// 默认本地化语言
dayjs.locale('zh-cn')

/** 默认时区 */
export const DEFAULT_TIMEZONE = 'Asia/Shanghai'

/** 常用日期格式常量 */
export const DATE_FORMAT = {
  /** 完整日期时间 */
  FULL: 'YYYY-MM-DD HH:mm:ss',
  /** 日期 */
  DATE: 'YYYY-MM-DD',
  /** 时间 */
  TIME: 'HH:mm:ss',
  /** 日期时间（到分钟） */
  MINUTE: 'YYYY-MM-DD HH:mm',
  /** 月-日 */
  MONTH_DAY: 'MM-DD',
  /** 中文完整 */
  CN_FULL: 'YYYY年MM月DD日 HH:mm:ss',
  /** 中文日期 */
  CN_DATE: 'YYYY年MM月DD日',
} as const

/**
 * 将任意时间值转换为指定时区的 dayjs 实例
 * @param time - 时间值（ISO字符串、Unix时间戳、Date对象等）
 * @param timezone - 目标时区，默认 Asia/Shanghai
 */
export function toTimezone(
  time: string | number | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE
): dayjs.Dayjs | null {
  if (time === null || time === undefined || time === '') return null
  return dayjs(time).tz(timezone)
}

/**
 * 格式化日期时间
 * @param time - 时间值
 * @param format - 格式字符串，默认 'YYYY-MM-DD HH:mm:ss'
 * @param timezone - 时区，默认 Asia/Shanghai
 * @returns 格式化后的日期字符串，无效值返回空字符串
 */
export function formatDateTime(
  time: string | number | Date | null | undefined,
  format: string = DATE_FORMAT.FULL,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const dt = toTimezone(time, timezone)
  return dt ? dt.format(format) : ''
}

/**
 * 格式化日期（YYYY-MM-DD）
 */
export function formatDate(
  time: string | number | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatDateTime(time, DATE_FORMAT.DATE, timezone)
}

/**
 * 格式化日期时间到分钟（YYYY-MM-DD HH:mm）
 */
export function formatMinute(
  time: string | number | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatDateTime(time, DATE_FORMAT.MINUTE, timezone)
}

/**
 * 相对时间（刚刚、X分钟前、X小时前、X天前...）
 * @param time - 时间值
 * @param timezone - 时区，默认 Asia/Shanghai
 */
export function formatRelativeTime(
  time: string | number | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE
): string {
  if (!time) return ''
  const dt = dayjs(time).tz(timezone)
  const now = dayjs().tz(timezone)
  const diffMs = now.valueOf() - dt.valueOf()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 60) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 30) return `${diffDays}天前`
  if (diffMonths < 12) return `${diffMonths}个月前`
  return `${diffYears}年前`
}

/**
 * 智能格式化：
 * - 当天显示时间 HH:mm
 * - 昨天显示 "昨天 HH:mm"
 * - 今年显示 "MM-DD HH:mm"
 * - 跨年显示 "YYYY-MM-DD HH:mm"
 *
 * @param time - 时间值
 * @param timezone - 时区，默认 Asia/Shanghai
 */
export function formatSmart(
  time: string | number | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE
): string {
  if (!time) return ''
  const dt = dayjs(time).tz(timezone)
  const now = dayjs().tz(timezone)

  if (dt.isSame(now, 'day')) {
    return dt.format('HH:mm')
  }

  const yesterday = now.subtract(1, 'day')
  if (dt.isSame(yesterday, 'day')) {
    return `昨天 ${dt.format('HH:mm')}`
  }

  if (dt.isSame(now, 'year')) {
    return dt.format('MM-DD HH:mm')
  }

  return dt.format('YYYY-MM-DD HH:mm')
}

/**
 * 判断时间是否为今天
 */
export function isToday(
  time: string | number | Date | null | undefined,
  timezone: string = DEFAULT_TIMEZONE
): boolean {
  if (!time) return false
  const dt = dayjs(time).tz(timezone)
  return dt.isSame(dayjs().tz(timezone), 'day')
}

/**
 * 默认导出（兼容 import dateUtils from '...' 的方式）
 */
export default {
  DEFAULT_TIMEZONE,
  DATE_FORMAT,
  toTimezone,
  formatDateTime,
  formatDate,
  formatMinute,
  formatRelativeTime,
  formatSmart,
  isToday,
}
