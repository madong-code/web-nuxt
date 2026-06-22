/**
 * URL 处理工具
 */
import { useRuntimeConfig } from 'nuxt/app'

/**
 * 获取基础URL
 */
const getBaseUrl = () => {
  const config = useRuntimeConfig()
  return config.public.API_BASE_URL || ''
}

/**
 * 将后端返回的绝对URL转换为相对URL或当前环境的URL
 * @param url 后端返回的URL
 * @returns 适配当前环境的URL
 */
export function normalizeUrl(url: string): string {
  if (!url) return ''

  // 如果是相对路径，直接返回
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url
  }

  try {
    const urlObj = new URL(url)
    const baseUrl = getBaseUrl()

    // 如果配置了基础URL，替换域名
    if (baseUrl) {
      const baseUrlObj = new URL(baseUrl)
      urlObj.protocol = baseUrlObj.protocol
      urlObj.host = baseUrlObj.host
      if (baseUrlObj.port) {
        urlObj.port = baseUrlObj.port
      }
      return urlObj.toString()
    }

    // 否则返回相对路径
    return urlObj.pathname + urlObj.search + urlObj.hash
  } catch (error) {
    console.error('URL解析失败:', error)
    return url
  }
}

/**
 * 转换URL为绝对路径（用于显示）
 * @param url 相对或绝对URL
 * @returns 完整的URL
 */
export function toFullUrl(url: string): string {
  if (!url) return ''

  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 拼接基础URL
  const baseUrl = getBaseUrl()
  if (baseUrl) {
    return baseUrl.replace(/\/$/, '') + '/' + url.replace(/^\//, '')
  }

  // 使用当前域名
  return window.location.origin + '/' + url.replace(/^\//, '')
}

/**
 * 将完整URL转换为相对路径（用于保存到数据库）
 * @param url 完整URL
 * @returns 相对路径
 */
export function toRelativeUrl(url: string): string {
  if (!url) return ''

  try {
    const urlObj = new URL(url)
    return urlObj.pathname + urlObj.search + urlObj.hash
  } catch (error) {
    console.error('URL解析失败:', error)
    return url
  }
}
