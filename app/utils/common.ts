import type { FormInstance } from 'element-plus'
import { isNull, trim } from 'lodash-es'
import type { CSSProperties } from 'vue'
import type { TranslateOptions } from 'vue-i18n'
import { useMemberStore } from '~/stores/member'
import { useConfigStore } from '~/stores/config'


type anyObj = { [key: string]: any }


/**
 * 获取token
 * @param type token类型，默认为Bearer
 * @returns 完整的token字符串
 */
export function getToken(type: string = 'Bearer'): null | string {
    // 优先从 store 获取
    let token = useMemberStore().token
    
    // 如果 store 中有token且不为空，直接返回
    if (token && token.trim() !== '') {
        return `${type} ${token}`
    }
    
    // 如果 store 中没有，尝试从 cookie 获取（处理页面刷新后的情况）
    const cookieToken = useCookie('token').value
    if (cookieToken && cookieToken.trim() !== '') {
        return `${type} ${cookieToken}`
    }
    
    return null
}

/**
 * 获取refresh token
 * @param type token类型，默认为Bearer
 * @returns 完整的refresh token字符串
 */
export function getRefreshToken(type: string = 'Bearer'): null | string {
    // 优先从 store 获取
    let refreshToken = useMemberStore().refreshToken
    
    // 如果 store 中有token且不为空，直接返回
    if (refreshToken && refreshToken.trim() !== '') {
        return `${type} ${refreshToken}`
    }
    
    // 如果 store 中没有，尝试从 cookie 获取（处理页面刷新后的情况）
    const cookieRefreshToken = useCookie('refreshToken').value
    if (cookieRefreshToken && cookieRefreshToken.trim() !== '') {
        return `${type} ${cookieRefreshToken}`
    }
    
    return null
}

/**
 * 获取资源完整地址
 * @param relativeUrl 资源相对地址
 * @param domain 指定域名
 */
export const fullUrl = (relativeUrl: string, domain = '') => {
    const configStore = useConfigStore()
    if (!domain) {
        domain = configStore?.cdn_url ? configStore?.cdn_url : import.meta.env.VITE_API_BASE_URL
    }
    if (!relativeUrl) return domain

    const regUrl = new RegExp(/^http(s)?:\/\//)
    const regexImg = new RegExp(/^((?:[a-z]+:)?\/\/|data:image\/)(.*)/i)
    if (!domain || regUrl.test(relativeUrl) || regexImg.test(relativeUrl)) {
        return relativeUrl
    }
    return domain + relativeUrl
}

/**
 * 将Markdown内容中的绝对URL转换为相对路径
 * @param markdown Markdown内容
 */
export const convertMarkdownToRelative = (markdown: string): string => {
    if (!markdown) return markdown
    const configStore = useConfigStore()
    const domain = configStore?.cdn_url || import.meta.env.VITE_API_BASE_URL || window.location.origin

    return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
        // 跳过 base64 图片和相对路径
        if (url.startsWith('data:') || !url.startsWith('http://') && !url.startsWith('https://')) {
            return match
        }
        // 将绝对URL转换为相对路径
        try {
            const urlObj = new URL(url)
            const pathname = urlObj.pathname
            return `![${alt}](${pathname})`
        } catch {
            return match
        }
    })
}

/**
 * 将Markdown内容中的相对路径转换为绝对URL
 * @param markdown Markdown内容
 */
export const convertMarkdownToFull = (markdown: string): string => {
    if (!markdown) return markdown
    const configStore = useConfigStore()
    const domain = configStore?.cdn_url || import.meta.env.VITE_API_BASE_URL || window.location.origin

    return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
        // 跳过 base64 图片和外部URL（OSS/CDN）
        if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
            return match
        }
        // 如果是相对路径，转换为绝对URL
        const fullUrl = url.startsWith('/') ? `${domain}${url}` : `${domain}/${url}`
        return `![${alt}](${fullUrl})`
    })
}

/**
 * 判断是否为外部URL（OSS/CDN等）
 */
export const isExternalUrl = (url: string): boolean => {
    return /^https?:\/\//.test(url) || /^data:image\//.test(url)
}

/**
 * 获取一组资源的完整地址
 * @param relativeUrls 资源相对地址
 * @param domain 指定域名
 */
export const arrayFullUrl = (relativeUrls: string | string[], domain = '') => {
    if (typeof relativeUrls === 'string') {
        relativeUrls = relativeUrls == '' ? [] : relativeUrls.split(',')
    }
    for (const key in relativeUrls) {
        relativeUrls[key] = fullUrl(relativeUrls[key], domain)
    }
    return relativeUrls
}

/**
 * 从一个文件路径中获取文件名
 * @param path 文件路径
 */
export const getFileNameFromPath = (path: string) => {
    const paths = path.split('/')
    return paths[paths.length - 1]
}

/**
 * 是否是外部链接
 * @param path
 */
export function isExternal(path: string): boolean {
    return /^(https?|ftp|mailto|tel):/.test(path)
}

/**
 * 是否为手机设备
 */
export const isMobile = () => {
    const event = useRequestEvent()
    const userAgent = import.meta.client ? navigator.userAgent : event?.node.req.headers['user-agent']
    if (!userAgent) return false
    return !!userAgent.match(
        /android|webos|ip(hone|ad|od)|opera (mini|mobi|tablet)|iemobile|windows.+(phone|touch)|mobile|fennec|kindle (Fire)|Silk|maemo|blackberry|playbook|bb10\; (touch|kbd)|Symbian(OS)|Ubuntu Touch/i
    )
}

/**
 * 防抖
 * @param fn 执行函数
 * @param ms 间隔毫秒数
 */
export const debounce = (fn: Function, ms: number) => {
    return (...args: any[]) => {
        if (globals.lazy) {
            clearTimeout(globals.lazy)
        }
        globals.lazy = setTimeout(() => {
            fn(...args)
        }, ms)
    }
}

/**
 * 表单重置
 * @param formEl
 */
export function onResetForm(formEl?: FormInstance | null) {
    typeof formEl?.resetFields == 'function' && formEl?.resetFields()
}

/**
 * 根据pk字段的值从数组中获取key
 * @param arr
 * @param pk
 * @param value
 */
export const getArrayKey = (arr: any, pk: string, value: any): any => {
    for (const key in arr) {
        if (arr[key][pk] == value) {
            return key
        }
    }
    return false
}

/**
 * 获取简洁的路由 path
 */
export const getCurrentRoutePath = () => {
    const router = useRouter()
    let path = router.currentRoute.value.path
    if (path.indexOf('?') !== -1) path = path.replace(/\?.*/, '')
    return path
}

export function auth(node: string): boolean
export function auth(node: { name: string; subNodeName?: string }): boolean

/**
 * 权限检查函数
 * @param node 权限节点，可以是字符串或对象
 * @returns 是否有权限
 */
export function auth(node: string | { name: string; subNodeName?: string }): boolean {
    // TODO: 实现权限检查逻辑
    // 目前先返回 true，表示所有用户都有权限
    return true
}

/*
 * 格式化时间戳
 */
export const timeFormat = (dateTime: string | number | null = null, fmt = 'yyyy-mm-dd hh:MM:ss') => {
    if (dateTime == 'none') {
        return i18n.global.t('None')
    }

    if (isNull(dateTime)) {
        dateTime = Number(new Date())
    }

    let date: Date

    if (typeof dateTime === 'string') {
        date = new Date(dateTime)
    } else {
        if (dateTime.toString().length === 10) {
            dateTime = +dateTime * 1000
        }
        date = new Date(Number(dateTime))
    }

    if (isNaN(date.getTime())) {
        return ''
    }

    let ret
    const opt: anyObj = {
        'y+': date.getFullYear().toString(), // 年
        'm+': (date.getMonth() + 1).toString(), // 月
        'd+': date.getDate().toString(), // 日
        'h+': date.getHours().toString(), // 时
        'M+': date.getMinutes().toString(), // 分
        's+': date.getSeconds().toString(), // 秒
    }
    for (const k in opt) {
        ret = new RegExp('(' + k + ')').exec(fmt)
        if (ret) {
            fmt = fmt.replace(ret[1], ret[1].length == 1 ? opt[k] : padStart(opt[k], ret[1].length, '0'))
        }
    }
    return fmt
}

/*
 * 字符串补位
 */
const padStart = (str: string, maxLength: number, fillString = ' ') => {
    if (str.length >= maxLength) return str

    const fillLength = maxLength - str.length
    let times = Math.ceil(fillLength / fillString.length)
    while ((times >>= 1)) {
        fillString += fillString
        if (times === 1) {
            fillString += fillString
        }
    }
    return fillString.slice(0, fillLength) + str
}

/**
 * calc(100vh - minusHeight)
 * @param minusHeight 需要减去的高度
 * @returns CSSProperties
 */
export function calcHeight(minusHeight = 60): CSSProperties {
    return {
        height: 'calc(100vh - ' + minusHeight.toString() + 'px)',
    }
}
