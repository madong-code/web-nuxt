import { ElMessage } from 'element-plus'
import qs from 'qs'
import { getToken } from '~/utils/common'
import { useRuntimeConfig, navigateTo, tryUseNuxtApp } from 'nuxt/app'
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

// ====== SSR 上下文安全：runtimeConfig 进程级缓存 ======
// useAsyncData handler / async IIFE 的深层 await 链中 Nuxt 实例上下文可能丢失，
// useRuntimeConfig/useStore 届时会抛错 → 请求立即 reject → 页面 catch 兜底空数据，
// SSR 直出空导航/默认站名并引发 hydration mismatch（线上「渲染异常」根因）。
// SSR 端在有上下文的任何时机写入缓存（插件预热或首次成功调用），脱离上下文时回退缓存。
type RuntimeConfig = ReturnType<typeof useRuntimeConfig>
let serverRuntimeConfigCache: RuntimeConfig | null = null
let clientRuntimeConfigCache: RuntimeConfig | null = null

function getRuntimeConfig(): RuntimeConfig {
    if (import.meta.server) {
        const nuxtApp = tryUseNuxtApp()
        if (nuxtApp) {
            serverRuntimeConfigCache = (useRuntimeConfig as any)(nuxtApp) as RuntimeConfig
            return serverRuntimeConfigCache
        }
        if (serverRuntimeConfigCache) return serverRuntimeConfigCache
        throw new Error('[request] Nuxt runtimeConfig unavailable (no context & no cache)')
    }
    // 客户端同样防御：onMounted/app:mounted 等异步回调、async 链深层会脱离 Nuxt
    // 实例上下文，useRuntimeConfig() 直接抛错导致请求被兜底成空数据（表现为
    // 「刷新非根路由后导航自愈失败」）。有上下文时写缓存，脱离时回退缓存，
    // 最终兜底按 location 推导（客户端必然存在 window）。
    const nuxtApp = tryUseNuxtApp()
    if (nuxtApp) {
        clientRuntimeConfigCache = (useRuntimeConfig as any)(nuxtApp) as RuntimeConfig
        return clientRuntimeConfigCache
    }
    if (clientRuntimeConfigCache) return clientRuntimeConfigCache
    return {
        public: {
            API_BASE_URL: `${location.origin}/api/`,
        },
    } as RuntimeConfig
}

/** 插件预热入口：请求早期（必有上下文）写入缓存，供后续脱离上下文的请求兜底 */
export function warmRequestRuntimeConfig(): void {
    const nuxtApp = tryUseNuxtApp()
    if (!nuxtApp) return
    const cfg = (useRuntimeConfig as any)(nuxtApp)
    if (import.meta.server) serverRuntimeConfigCache = cfg
    else clientRuntimeConfigCache = cfg
}

/** token 读取防御：SSR 脱离 Pinia 上下文时 useMemberStore 会抛错，不应中断请求 */
function safeGetToken(): string | null {
    try {
        return getToken()
    } catch {
        return null
    }
}

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
      const runtimeConfig = getRuntimeConfig()

      this.options.baseURL = this.resolveBaseUrl(runtimeConfig)
      const channelKey = (runtimeConfig.public.REQUEST_HEADER_CHANNEL_KEY as string) || 'channel'
      const tokenKey = (runtimeConfig.public.REQUEST_HEADER_TOKEN_KEY as string) || 'Authorization'

      this.options.headers[channelKey] = 'pc'
      // 显式声明 JSON：后端 BusinessException 仅在 expectsJson 时返回 JSON，
      // 否则会返回纯文本错误消息导致前端解析失败
      this.options.headers['Accept'] = 'application/json'
      const token = safeGetToken()
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
          if (options.showSuccessMessage) this.notify(data.msg, 'success')
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
    const runtimeConfig = getRuntimeConfig()
    const envTenantId = runtimeConfig.public.X_TENANT_ID
    if (envTenantId) {
      return String(envTenantId)
    }
    // 3. 从 store 读取（仅客户端；脱离 Pinia 上下文时静默跳过）
    if (process.client) {
      try {
        const storeTenantId = useSystemStore().tenantId
        return storeTenantId ? String(storeTenantId) : null
      } catch {
        return null
      }
    }
    return null
  }

  /**
   * 解析 API 基础地址：
   * - 浏览器端：相对 /api（由 Vite/Nginx 代理）或配置的绝对地址
   * - SSR 端：相对地址在 Node 中无法解析，回退内网绝对地址 NUXT_API_SERVER_BASE
   */
  private resolveBaseUrl(runtimeConfig: ReturnType<typeof useRuntimeConfig>): string {
    const configured = this.options.baseURL || (runtimeConfig.public.API_BASE_URL as string) || ''
    if (import.meta.server && (!configured || configured.startsWith('/'))) {
      return (runtimeConfig.apiServerBase as string) || 'http://127.0.0.1:8500/api'
    }
    return configured || `${location.origin}/api/`
  }

  /** 仅浏览器端弹出消息（SSR 阶段无 DOM，ElMessage 会直接抛错） */
  private notify(message: string, type: 'error' | 'success' = 'error'): void {
    if (import.meta.client) ElMessage({ message, type })
  }

  /**
   * 拼接完整请求 URL（消除 upload / request / refreshToken 中重复的 baseURL 拼接逻辑）
   */
  private buildFullUrl(url: string): string {
    const runtimeConfig = getRuntimeConfig()
    const baseURL = this.resolveBaseUrl(runtimeConfig)
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
            ...(this.options.headers as Record<string, string>),
            ...((config.headers || {}) as Record<string, string>),
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
            // 401：与 request() 一致，尝试刷新 token 后重发一次，避免上传类请求
            // 因 access token 过期而直接失败（表现为"上传无响应"）
            if (data.code == 401) {
              const memberStore = useMemberStore()
              if (!memberStore.refreshToken) {
                memberStore.logout()
                this.notify(data.msg || '登录已过期，请重新登录')
                reject(new Error(data.msg || '登录已过期，请重新登录'))
                return
              }
              try {
                const newToken = await this.handle401Error({
                  url: fullURL,
                  method: 'POST',
                  options: requestOptions,
                  config
                })
                this.options.headers['Authorization'] = `Bearer ${newToken}`
                ;(requestOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`
                const retryResponse = await fetch(fullURL, {
                  method: 'POST',
                  headers: { ...requestOptions.headers },
                  body: formData
                })
                const retryData = await retryResponse.json()
                if (retryData && retryData.code !== undefined && retryData.code == 0) {
                  resolve(config.returnFullResponse ? retryData : retryData.data)
                } else {
                  const retryMsg = retryData?.msg || '请求失败'
                  this.notify(retryMsg)
                  reject(new Error(retryMsg))
                }
              } catch (refreshError: any) {
                console.error('[upload] Token refresh failed:', refreshError)
                reject(refreshError)
              }
              return
            }

            // 特殊处理 403
            if (data.code == 403) {
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

              this.notify(data.msg || '请求失败')
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
          this.notify('网络请求失败')
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
              resolve(blob as any)
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
                ;(requestOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`
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
                  this.notify(newData.msg || '请求失败')
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
              this.notify(data.msg || '请求失败')
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
          this.notify('网络请求失败')
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
        // SSR 脱离上下文时 navigateTo 会抛错，静默降级（站点关闭提示由客户端接管）
        try {
          navigateTo('/site/close', { replace: true })
        } catch {}
        break;
    }
  }

  private handleNetworkError(err: any) {
    // SSR 脱离上下文时 i18n 的 t() 会抛错，降级为无提示
    const tr = (key: string): string => {
      try {
        return t(key)
      } catch {
        return ''
      }
    }
    if (err.status && err.status != 200) {
      let errMessage = ''
      switch (err.status) {
        case 400:
          errMessage = tr('common.request.400')
          break
        case 401:
          errMessage = tr('common.request.401')
          // 401 错误由 handle401Error 处理
          break
        case 403:
          errMessage = tr('common.request.403')
          break
        case 404:
          errMessage = err.url + tr('common.request.404')
          break
        case 405:
          errMessage = tr('common.request.405')
          break
        case 408:
          errMessage = tr('common.request.408')
          break
        case 409:
          errMessage = tr('common.request.409')
          break
        case 500:
          errMessage = tr('common.request.500')
          break
        case 501:
          errMessage = tr('common.request.501')
          break
        case 502:
          errMessage = tr('common.request.502')
          break
        case 503:
          errMessage = tr('common.request.503')
          break
        case 504:
          errMessage = tr('common.request.504')
          break
        case 505:
          errMessage = tr('common.request.505')
          break
      }
      if (errMessage) {
        this.notify(errMessage)
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

  const runtimeConfig = getRuntimeConfig()
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

  const runtimeConfig = getRuntimeConfig()
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
  } as any)
}
