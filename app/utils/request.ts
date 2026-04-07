import { ElMessage } from 'element-plus'
import qs from 'qs'
import { getToken, getRefreshToken } from './common'
import { useRuntimeConfig, navigateTo, useCookie } from 'nuxt/app'
import { useMemberStore } from '~/stores/member'

// 响应数据类型定义
interface ResponseData<T = any> {
    code: number
    msg: string
    data: T
    type?: string
}

interface ConfigOption {
    showErrorMessage?: boolean
    showSuccessMessage?: boolean,
    headers?: Headers
    // 控制是否返回完整响应对象（默认 false 返回 data）
    returnFullResponse?: boolean
    // 响应类型
    responseType?: 'json' | 'blob' | 'text'
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

class Http {
    private options: FetchOptions = {
        baseURL: '',
        headers: {},
        watch: false
    }
    private isRefreshing = false
    private refreshSubscribers: ((token: string) => void)[] = []

    public constructor() {
    /**
     * 全局请求拦截器
     */
    this.options.onRequest = (data) => {
        const runtimeConfig = useRuntimeConfig()

        this.options.baseURL = (runtimeConfig.public.VITE_APP_BASE_URL as string) || `${location.origin}/api/`
        const channelKey = (runtimeConfig.public.VITE_REQUEST_HEADER_CHANNEL_KEY as string) || 'channel'
        const tokenKey = (runtimeConfig.public.VITE_REQUEST_HEADER_TOKEN_KEY as string) || 'Authorization'

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
            setTimeout(async () => {
                try {
                    // 处理首次请求baseurl空的问题
                    const runtimeConfig = useRuntimeConfig()
                    const baseURL = this.options.baseURL || (runtimeConfig.public.VITE_APP_BASE_URL as string) || `${location.origin}/api/`

                    // 处理 URL 路径，确保没有多余的斜杠
                    const normalizedBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
                    const normalizedUrl = url.startsWith('/') ? url.slice(1) : url
                    const fullURL = `${normalizedBaseURL}/${normalizedUrl}`

                    // 执行请求拦截器
                    if (this.options.onRequest) {
                        this.options.onRequest({ url: fullURL, method: 'POST' })
                    }

                    // 构建请求选项
                    const requestOptions: RequestInit = {
                        method: 'POST',
                        headers: {
                            ...this.options.headers,
                            ...(config.headers || {})
                            // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
                        }
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
            }, this.options.baseURL ? 0 : 500)
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
     * @param url
     * @param method
     * @param param
     * @param config
     */
    private request<T = any>(url: string, method: string, param: AnyObject = {}, config: ConfigOption = {}): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            setTimeout(async () => {
                try {
                    // 处理首次请求baseurl空的问题
                    const runtimeConfig = useRuntimeConfig()
                    const baseURL = this.options.baseURL || (runtimeConfig.public.VITE_APP_BASE_URL as string) || `${location.origin}/api/`
                    
                    // 处理 URL 路径，确保没有多余的斜杠
                    const normalizedBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
                    const normalizedUrl = url.startsWith('/') ? url.slice(1) : url
                    const fullURL = `${normalizedBaseURL}/${normalizedUrl}`
                    
                    // 执行请求拦截器
                    if (this.options.onRequest) {
                        this.options.onRequest({ url: fullURL, method })
                    }
                    
                    // 构建请求选项
                    const requestOptions: RequestInit = {
                        method,
                        headers: {
                            'Content-Type': 'application/json',
                            ...this.options.headers,
                            ...(config.headers || {}),
                            ...(param.headers || {})
                        }
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
                            
                            // 直接从 localStorage 读取验证
                            const stored = localStorage.getItem('member-store')
                            console.log('[request] localStorage:', stored)
                            console.log('[request] memberStore.refreshToken:', !!memberStore.refreshToken)
                            
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
            }, this.options.baseURL ? 0 : 500);
        })
    }

    private async handle401Error(originalRequest: any): Promise<string> {
        if (this.isRefreshing) {
            // 如果正在刷新 token，将请求加入队列
            return new Promise((resolve) => {
                this.refreshSubscribers.push((token) => {
                    originalRequest.options.headers['Authorization'] = `Bearer ${token}`
                    resolve(token)
                })
            })
        }

        this.isRefreshing = true

        try {
            // 刷新 token
            const newToken = await this.refreshToken()
            
            // 通知所有队列中的请求
            this.refreshSubscribers.forEach((callback) => callback(newToken))
            this.refreshSubscribers = []
            
            return newToken
        } catch (error) {
            // 刷新失败，跳转到登录页
            useMemberStore().logout()
            throw error
        } finally {
            this.isRefreshing = false
        }
    }

    private async refreshToken(): Promise<string> {
        const runtimeConfig = useRuntimeConfig()
        let baseURL = this.options.baseURL || (runtimeConfig.public.VITE_APP_BASE_URL as string) || `${location.origin}/api`
        
        // 移除末尾斜杠，统一 URL 拼接
        baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL

        // 从 store 中获取 refresh token
        const memberStore = useMemberStore()
        let refreshToken = memberStore.refreshToken

        // 如果 store 中没有，尝试从 cookie 获取
        if (!refreshToken) {
            const cookieRefreshToken = useCookie('refreshToken').value
            if (cookieRefreshToken) {
                refreshToken = cookieRefreshToken
            }
        }

        if (!refreshToken) {
            throw new Error('No refresh token available')
        }

        const response = await fetch(`${baseURL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        })

        const data = await response.json()

        if (data.code == 0 && data.data) {
            const { access_token, refresh_token } = data.data
            
            // 更新 store 中的 token
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

