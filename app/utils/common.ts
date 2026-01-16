import type { FormInstance } from 'element-plus'
import { isNull, trim } from 'lodash-es'
import type { CSSProperties } from 'vue'
import type { TranslateOptions } from 'vue-i18n'


type anyObj = { [key: string]: any }


/**
 * 获取token
 * @returns
 */
export function getToken(): null | string {
    return useMemberStore().token
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
 * 鉴权
 * 提供 string 将根据当前路由 path 自动拼接和鉴权，还可以提供路由的 name 对象进行鉴权
 * @param node
 */
export function auth(node: string | { name: string; subNodeName?: string }) {
    const store = usePersonalCenterStore()
    if (typeof node === 'string') {
        const path = getCurrentRoutePath()
        if (store.state.authNode.has(path)) {
            const subNodeName = path + (path == '/' ? '' : '/') + node
            if (store.state.authNode.get(path)!.some((v: string) => v == subNodeName)) {
                return true
            }
        }
    } else {
        // 节点列表中没有找到 name
        if (!node.name || !store.state.authNode.has(node.name)) return false

        // 无需继续检查子节点或未找到子节点
        if (!node.subNodeName || store.state.authNode.get(node.name)?.includes(node.subNodeName)) return true
    }
    return false
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
    if (dateTime.toString().length === 10) {
        dateTime = +dateTime * 1000
    }

    const date = new Date(Number(dateTime))
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
