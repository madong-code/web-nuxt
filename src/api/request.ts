import { ElMessage } from 'element-plus'
import qs from 'qs'
import { getToken } from '~/utils/common'
import { useRuntimeConfig, navigateTo } from 'nuxt/app'
import { useMemberStore } from '~/stores/member'
import { useSystemStore } from '~/stores/system'
import { t } from '~/composables/lang'

// ====== 响应类型定义 ======

interface ResponseData<T = any> {
  code: number
  msg: string
  data: T
  type?: string
}

export interface ConfigOption {
  showErrorMessage?: boolean
  showSuccessMessage?: boolean
  headers?: Headers | Record<string, string>
  // 控制是否返回完整响应对象（默认 false 返回 data）
  returnFullResponse?: boolean
  // 响应类型
  responseType?: 'json' | 'blob' | 'text'
  // 多租户：允许请求级别覆盖 X-Tenant-Id
  //   tenantId: string | number → 使用指定值
  //   tenantId: null          → 跳过注入
  //   tenantId: undefined     → 自动注入（默认行为）
  tenantId?: string | number | null
}

interface FetchOptions {
  baseURL: string
  headers: Record<string, any>
  onRequest?: (data: any) => void
  onResponse?: (data: any) => void
  onResponseError?: (data: any) => void
  showErrorMessage?: boolean
  showSuccessMessage?: boolean
  watch: boolean
}

// ====== SSE 类型定义 ======

export interface SseEventHandlers {
  onOpen?: () => void
  onMessage?: (data: any) => void
  onError?: (event: Event) => void
  [customEvent: string]: ((data: any, event?: MessageEvent) => void) | undefined
}

export interface SseRequestOptions extends RequestInit {
  onMessage?: (chunk: string) => void
  onEnd?: () => void
}

export interface SseConnection {
  close: () => void
  readyState: () => number
}

// ====== Http 类 ======

class Http {
  private options: FetchOptions = {
    baseURL: '',
    headers: {},
    watch: false
  }
  private isRefreshing = false
  private refreshSubscribers: { resolve: (token: string) => void; reject: (err: any) => void }[] = []

  public constructor() {
    /**
     * 全局请求拦截器
     */
    this.options.onRequest = (data) => {
      const runtimeConfig = useRuntimeConfig()

      this.options.baseURL = (runtimeConfig.public.API_BASE_URL as string) || `${location.origin}/api/`
      const channelKey = (runtimeConfig.public.REQUEST_HEADER_CHANNEL_KEY as string) || 'channel'
      const tokenKey = (runtimeConfig.public.REQUEST_HEADER_TOKEN_KEY as string) || 'Authorization'

      this.options.headers[channelKey] = 'pc'
      const token = getToken()
      if (token) {
        this.options.headers[tokenKey] = token
      } else {
        // 清除Authorization头，确保退出登录后不会携带旧token
        delete this.options.headers[tokenKey]
      }
    }

    /**
     * 全局响应拦截器
     */
    this.options.onResponse = ({ response, options }) => {
      const { _data: data } = response
      this.handleNetworkError(response)
      if (data && data.code != undefined) {
        if (data.code == 0) {
          if (options.showSuccessMessage) ElMessage({ message: data.msg, type: 'success' })
        } else {
          // 移除这里的错误提示，由 request 方法统一处理，避免重复提示
          this.handleAuthError(data.code)
        }
      }
    }
  }

  /**
   * 解析租户 ID（优先级：请求配置 > 环境变量 > store）
   */
  private resolveTenantId(config: ConfigOption): string | null {
    // 1. 请求配置显式传入（tenantId: null = 跳过注入）
    if (config.tenantId !== undefined) {
      return config.tenantId !== null ? String(config.tenantId) : null
    }
    // 2. 从环境变量读取默认值
    const runtimeConfig = useRuntimeConfig()
    const envTenantId = runtimeConfig.public.X_TENANT_ID
    if (envTenantId) {
      return String(envTenantId)
    }
    // 3. 从 store 读取（仅客户端）
    if (process.client) {
      const storeTenantId = useSystemStore().tenantId
      return storeTenantId ? String(storeTenantId) : null
    }
    return null
  }

  /**
   * 拼接完整请求 URL（消除 upload / request / refreshToken 中重复的 baseURL 拼接逻辑）
   */
  private buildFullUrl(url: string): string {
    const runtimeConfig = useRuntimeConfig()
    const baseURL = this.options.baseURL || (runtimeConfig.public.API_BASE_URL as string) || `${location.origin}/api/`
    const normalizedBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
    const normalizedUrl = url.startsWith('/') ? url.slice(1) : url
    return `${normalizedBaseURL}/${normalizedUrl}`
  }

  public get<T = any>(url: string, query = {}, config: ConfigOption = {}): Promise<T> {
    url += '?' + qs.stringify(query)
    return this.request<T>(url, 'GET', {}, config)
  }

  public post<T = any>(url: string, body = {}, config: ConfigOption = {}): Promise<T> {
    return this.request<T>(url, 'POST', { body }, config)
  }

  /**
   * 上传文件
   */
  public upload<T = any>(url: string, formData: FormData, config: ConfigOption = {}): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      (async () => {
        try {
          const fullURL = this.buildFullUrl(url)

          // 执行请求拦截器
          if (this.options.onRequest) {
            this.options.onRequest({ url: fullURL, method: 'POST' })
          }

          // 注入 X-Tenant-Id
          const tenantId = this.resolveTenantId(config)
          const requestHeaders: Record<string, string> = {
            ...this.options.headers,
            ...(config.headers || {}),
          }
          if (tenantId) {
            requestHeaders['X-Tenant-Id'] = tenantId
          }

          // 构建请求选项
          const requestOptions: RequestInit = {
            method: 'POST',
            headers: requestHeaders,
          }

          // FormData 直接作为 body，不进行 JSON.stringify
          requestOptions.body = formData

          // 添加超时处理
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Request timeout'))
            }, 60000) // 上传文件超时时间改为60秒
          })

          const fetchPromise = fetch(fullURL, requestOptions)

          const response = await Promise.race([fetchPromise, timeoutPromise])
          const data = await response.json()

          // 执行响应拦截器
          if (this.options.onResponse) {
            this.options.onResponse({ response: { _data: data }, options: config })
          }

          // 处理响应数据
          if (data && data.code !== undefined) {
            // 特殊处理 401 和 403
            if (data.code == 401 || data.code == 403) {
              this.handleAuthError(data.code)
            }

            // code != 0 时的处理
            if (data.code != 0) {
              if (config.showErrorMessage === false) {
                if (config.returnFullResponse) {
                  resolve(data as T)
                } else {
                  resolve(data.data as T)
                }
                return
              }

              ElMessage({ message: data.msg || '请求失败', type: 'error' })
              reject(new Error(data.msg || '请求失败'))
              return
            }

            // code == 0 时根据配置决定返回什么
            if (config.returnFullResponse) {
              resolve(data as T)
            } else {
              resolve(data.data as T)
            }
          } else {
            resolve(data)
          }
        } catch (error) {
          console.error('[upload] Error:', error)
          ElMessage({ message: '网络请求失败', type: 'error' })
          reject(error)
        }
      })()
    })
  }

  public put<T = any>(url: string, body = {}, config: ConfigOption = {}): Promise<T> {
    return this.request<T>(url, 'PUT', { body }, config)
  }

  public delete<T = any>(url: string, body = {}, config: ConfigOption = {}): Promise<T> {
    return this.request<T>(url, 'DELETE', { body }, config)
  }

  /**
   * 发送请求
   */
  private request<T = any>(url: string, method: string, param: AnyObject = {}, config: ConfigOption = {}): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      (async () => {
        try {
          const fullURL = this.buildFullUrl(url)

          // 执行请求拦截器
          if (this.options.onRequest) {
            this.options.onRequest({ url: fullURL, method })
          }

          // 注入 X-Tenant-Id
          const tenantId = this.resolveTenantId(config)
          const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...this.options.headers,
            ...(config.headers || {}),
            ...(param.headers || {}),
          }
          if (tenantId) {
            requestHeaders['X-Tenant-Id'] = tenantId
          }

          // 构建请求选项
          const requestOptions: RequestInit = {
            method,
            headers: requestHeaders,
          }

          // 添加请求体
          if (param.body) {
            requestOptions.body = JSON.stringify(param.body)
          }

          // 发送请求
          // 添加超时处理
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Request timeout'))
            }, 30000) // 30秒超时
          })

          const fetchPromise = fetch(fullURL, requestOptions)

          const response = await Promise.race([fetchPromise, timeoutPromise])

          // 根据 responseType 处理响应
          let data
          const responseType = config.responseType || 'json'

          if (responseType === 'json') {
            data = await response.json()
          } else if (responseType === 'blob') {
            // 对于blob类型，直接读取blob并返回
            try {
              const blob = await response.blob()
              resolve(blob)
              return
            } catch (error) {
              console.error('[request] Error reading blob:', error)
              reject(error)
              return
            }
          } else if (responseType === 'text') {
            data = await response.text()
          } else {
            data = await response.json()
          }

          // 执行响应拦截器（仅对 JSON 响应执行）
          if (responseType === 'json' && this.options.onResponse) {
            this.options.onResponse({ response: { _data: data }, options: config })
          }

          // 处理响应数据
          if (responseType === 'json' && data && data.code !== undefined) {
            // 特殊处理 401 和 403
            if (data.code == 401) {
              console.log('[request] Got 401, checking refreshToken...')
              // 检查是否有 refreshToken，如果没有则直接跳转到登录
              const memberStore = useMemberStore()

              let hasRefreshToken = !!memberStore.refreshToken

              if (!hasRefreshToken) {
                console.log('[request] No refreshToken in store')
                memberStore.logout()
                reject(new Error('登录已过期，请重新登录'))
                return
              }

              console.log('[request] Has refreshToken, attempting refresh...')
              // 尝试刷新 token
              const originalRequest = {
                url: fullURL,
                method,
                options: requestOptions,
                config
              }
              this.handle401Error(originalRequest).then((newToken) => {
                console.log('[request] New token:', newToken?.substring(0, 20) + '...')
                // 重新发送请求
                this.options.headers['Authorization'] = `Bearer ${newToken}`
                requestOptions.headers['Authorization'] = `Bearer ${newToken}`
                return fetch(fullURL, requestOptions)
              }).then(async (newResponse) => {
                const newData = await newResponse.json()
                if (newData.code == 0) {
                  if (config.returnFullResponse) {
                    resolve(newData as T)
                  } else {
                    resolve(newData.data as T)
                  }
                } else {
                  ElMessage({ message: newData.msg || '请求失败', type: 'error' })
                  reject(new Error(newData.msg || '请求失败'))
                }
              }).catch((error) => {
                console.error('[request] Error refreshing token:', error)
                reject(error)
              })
              return
            } else if (data.code == 403) {
              this.handleAuthError(data.code)
            }

            // code != 0 时的处理
            if (data.code != 0) {
              // 如果配置了 showErrorMessage: false，则不中断，返回 data
              if (config.showErrorMessage === false) {
                if (config.returnFullResponse) {
                  resolve(data as T)
                } else {
                  resolve(data.data as T)
                }
                return
              }

              // 否则显示错误提示并中断
              ElMessage({ message: data.msg || '请求失败', type: 'error' })
              reject(new Error(data.msg || '请求失败'))
              return
            }

            // code == 0 时根据配置决定返回什么
            if (config.returnFullResponse) {
              // 返回完整对象
              resolve(data as T)
            } else {
              // 默认只返回 data
              resolve(data.data as T)
            }
          } else {
            // 非 JSON 响应直接返回
            resolve(data as T)
          }
        } catch (error) {
          console.error('[request] Error:', error)
          ElMessage({ message: '网络请求失败', type: 'error' })
          reject(error)
        }
      })();
    })
  }

  private async handle401Error(originalRequest: any): Promise<string> {
    if (this.isRefreshing) {
      // 如果正在刷新 token，将请求加入队列（保存 resolve/reject，刷新失败时 reject 挂起请求）
      return new Promise<string>((resolve, reject) => {
        this.refreshSubscribers.push({ resolve, reject })
      })
    }

    this.isRefreshing = true

    try {
      // 刷新 token
      const newToken = await this.refreshToken()

      // 通知所有队列中的请求
      this.refreshSubscribers.forEach(({ resolve: resolveFn }) => resolveFn(newToken))
      this.refreshSubscribers = []

      return newToken
    } catch (error) {
      // 刷新失败：reject 所有挂起请求（避免并发请求永久 pending），再登出
      this.refreshSubscribers.forEach(({ reject: rejectFn }) => rejectFn(error))
      this.refreshSubscribers = []
      useMemberStore().logout()
      throw error
    } finally {
      this.isRefreshing = false
    }
  }

  private async refreshToken(): Promise<string> {
    // 从 store 中获取 refresh token（token 仅持久化于 member store，不存在 cookie）
    const memberStore = useMemberStore()
    const refreshToken = memberStore.refreshToken

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(this.buildFullUrl('/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    const data = await response.json()

    if (data.code == 0 && data.data) {
      const { access_token, refresh_token } = data.data

      // 更新 store 中的 token（permissions 不变）
      await memberStore.setToken(access_token, refresh_token)

      return access_token
    } else {
      throw new Error(data.msg || 'Failed to refresh token')
    }
  }

  private handleAuthError(code: number) {
    switch (code) {
      case 401:
        // 401 错误由 handle401Error 处理
        break;
      case 402:
        navigateTo('/site/close', { replace: true })
        break;
    }
  }

  private handleNetworkError(err: any) {
    if (err.status && err.status != 200) {
      let errMessage = ''
      switch (err.status) {
        case 400:
          errMessage = t('common.request.400')
          break
        case 401:
          errMessage = t('common.request.401')
          // 401 错误由 handle401Error 处理
          break
        case 403:
          errMessage = t('common.request.403')
          break
        case 404:
          errMessage = err.url + t('common.request.404')
          break
        case 405:
          errMessage = t('common.request.405')
          break
        case 408:
          errMessage = t('common.request.408')
          break
        case 409:
          errMessage = t('common.request.409')
          break
        case 500:
          errMessage = t('common.request.500')
          break
        case 501:
          errMessage = t('common.request.501')
          break
        case 502:
          errMessage = t('common.request.502')
          break
        case 503:
          errMessage = t('common.request.503')
          break
        case 504:
          errMessage = t('common.request.504')
          break
        case 505:
          errMessage = t('common.request.505')
          break
      }
      if (errMessage) {
        ElMessage({ message: errMessage, type: 'error' })
      }
    }
  }
}

const request = new Http()

export default request

// ====== SSE 支持 ======

/**
 * SSE (Server-Sent Events) — EventSource 模式（纯 GET）
 *
 * 基于原生 EventSource 封装，自动注入 baseURL 和 Token
 * 支持自定义命名事件（success / error / progress 等）
 * 相同 URL 自动去重，旧连接自动关闭
 *
 * @example
 * ```ts
 * import { sse } from '~/api/request'
 *
 * const conn = sse('/content/notify/sse', {
 *   onOpen: () => console.log('连接成功'),
 *   success: (payload) => { console.log('数据:', payload) },
 *   error: (payload) => { console.error('服务端错误:', payload) },
 *   onError: (event) => console.error('连接错误'),
 * });
 * conn.close();
 * ```
 */
const sseConnections = new Map<string, SseConnection>()

export function sse(
  url: string,
  eventHandlers: SseEventHandlers = {},
  extraParams?: Record<string, string | undefined>,
): SseConnection {
  // 仅客户端执行
  if (!process.client) {
    console.warn('[sse] Cannot create SSE connection on server side')
    return { close: () => {}, readyState: () => EventSource.CLOSED }
  }

  const runtimeConfig = useRuntimeConfig()
  const apiURL = (runtimeConfig.public.API_BASE_URL as string) || `${location.origin}/api/`

  // 构建完整 URL
  let fullUrl = url
  if (!/^https?:\/\//i.test(url)) {
    const base = apiURL.endsWith('/') ? apiURL.slice(0, -1) : apiURL
    fullUrl = `${base}${url.startsWith('/') ? '' : '/'}${url}`
  }

  // 关闭同 URL 的旧连接
  const existing = sseConnections.get(fullUrl)
  if (existing) {
    existing.close()
    sseConnections.delete(fullUrl)
  }

  // 注入额外参数
  if (extraParams) {
    const searchParams = new URLSearchParams()
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value)
      }
    })
    const qs = searchParams.toString()
    if (qs) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs
    }
  }

  // 注入认证 Token（EventSource 不支持自定义 headers，通过 URL 参数传递）
  const token = getToken()
  if (token) {
    const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
    fullUrl += `${fullUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(bearerToken)}`
  }

  const eventSource = new EventSource(fullUrl, { withCredentials: true })

  // 注册 onOpen
  if (eventHandlers.onOpen) {
    eventSource.addEventListener('open', () => eventHandlers.onOpen!())
  }

  // 注册默认 message 事件
  if (eventHandlers.onMessage) {
    eventSource.addEventListener('message', (event) => {
      try {
        eventHandlers.onMessage!(JSON.parse(event.data))
      } catch {
        eventHandlers.onMessage!(event.data)
      }
    })
  }

  // 注册自定义事件（排除内置事件名）
  const builtInEvents = new Set(['connectionError', 'error', 'onError', 'onMessage', 'onOpen'])
  Object.entries(eventHandlers).forEach(([eventName, handler]) => {
    if (builtInEvents.has(eventName) || typeof handler !== 'function') return
    eventSource.addEventListener(eventName, (event: Event) => {
      try {
        (handler as (data: any, event?: MessageEvent) => void)(
          JSON.parse((event as MessageEvent).data),
          event as MessageEvent,
        )
      } catch {
        (handler as (data: any) => void)((event as MessageEvent).data)
      }
    })
  })

  // error 事件处理：数据帧为业务错误，空帧为连接错误
  eventSource.addEventListener('error', (event) => {
    const me = event as MessageEvent
    if (me.data) {
      // 服务器发送的 event: error
      if (eventHandlers.error) {
        try {
          eventHandlers.error(JSON.parse(me.data))
        } catch {
          eventHandlers.error(me.data)
        }
      }
    } else if (eventHandlers.onError) {
      // 连接断开
      eventHandlers.onError(event)
    }
  })

  const cleanup: SseConnection = {
    close: () => {
      sseConnections.delete(fullUrl)
      eventSource.close()
    },
    readyState: () => eventSource.readyState,
  }

  // 注册到缓存（防重复创建）
  sseConnections.set(fullUrl, cleanup)

  return cleanup
}

/**
 * SSE — fetch + ReadableStream 模式（支持 GET/POST）
 *
 * 经过 Http 类的请求拦截器，完整获得 token/tenant 等 headers
 * 适用于需要 POST 的聊天/对话场景
 *
 * @example
 * ```ts
 * import { requestSSE } from '~/api/request'
 *
 * const abortController = new AbortController()
 * requestSSE('/chat/stream', {
 *   method: 'POST',
 *   body: JSON.stringify({ message: 'Hello' }),
 *   onMessage: (chunk) => console.log('收到:', chunk),
 *   onEnd: () => console.log('流结束'),
 *   signal: abortController.signal,
 * })
 * // 取消：abortController.abort()
 * ```
 */
export async function requestSSE(
  url: string,
  options: SseRequestOptions & {
    method?: string
    body?: BodyInit | null
    signal?: AbortSignal
  } = {},
): Promise<void> {
  const { onMessage, onEnd, ...fetchOptions } = options

  if (!process.client) {
    console.warn('[requestSSE] Cannot create SSE on server side')
    return
  }

  const runtimeConfig = useRuntimeConfig()
  const baseURL = (runtimeConfig.public.API_BASE_URL as string) || `${location.origin}/api/`

  // 处理 URL
  const normalizedBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
  const normalizedUrl = url.startsWith('/') ? url.slice(1) : url
  const fullURL = `${normalizedBaseURL}/${normalizedUrl}`

  // 构建 headers：从 options 和全局拦截器
  const channelKey = (runtimeConfig.public.REQUEST_HEADER_CHANNEL_KEY as string) || 'channel'
  const tokenKey = (runtimeConfig.public.REQUEST_HEADER_TOKEN_KEY as string) || 'Authorization'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    [channelKey]: 'pc',
    ...(fetchOptions.headers as Record<string, string> || {}),
  }

  const token = getToken()
  if (token) {
    headers[tokenKey] = token
  }

  try {
    const response = await fetch(fullURL, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SSE request failed: ${response.status} ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 按行解析 SSE 数据
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        // 处理 data: 行
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim()
          if (data === '[DONE]') continue
          onMessage?.(data)
        }
        // 忽略空行和注释行
      }
    }

    onEnd?.()
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('[requestSSE] Stream aborted')
      return
    }
    console.error('[requestSSE] Error:', error)
    throw error
  }
}

/**
 * SSE — POST 快捷方法
 */
export async function postSSE(
  url: string,
  body: any,
  options: SseRequestOptions = {},
): Promise<void> {
  return requestSSE(url, {
    ...options,
    method: 'POST',
    headers: {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}
