/**
 * 站点首页模块相关类型定义
 */

/**
 * 友情链接项
 */
export interface LinkItem {
    id: number
    name: string
    url: string
    logo?: string
    description?: string
    category?: string
    sort: number
    target?: string
    click_count?: number
    enabled: number
    created_at: number
    updated_at: number
    deleted_at: number | null
}

/**
 * 广告项
 */
export interface AdvertisementItem {
    id: number
    title: string
    link: string
    image: string
    description?: string
    sort: number
    enabled: number
    start_time: number
    end_time: number
    created_at: number
    updated_at: number
    deleted_at: number | null
}

/**
 * 导航菜单项
 */
export interface NavigationItem {
    id: number
    title: string
    url: string
    icon?: string
    code: string | null
    sort: number
    enabled: number
    is_show: number
}

/**
 * 站点首页数据
 */
export interface SiteData {
    advertisements: AdvertisementItem[]
    navigation: NavigationItem[]
    links: LinkItem[]
}

/**
 * 搜索配置项
 */
export interface SearchConfig {
    keyword: string              // 搜索引擎关键字
    keyword_enabled: number     // 是否启用关键字搜索 (0/1)
}

/**
 * 统计分析配置项
 */
export interface AnalyticsConfig {
    baidu_tongji_code: string    // 百度统计代码
    baidu_tongji_enabled: number // 是否启用百度统计 (0/1)
}



