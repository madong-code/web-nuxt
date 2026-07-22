/**
 * 站点首页模块相关类型定义
 */

/** 友情链接项 */
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

/** 广告项 */
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

/** 搜索配置项 */
export interface SearchConfig {
    keyword: string
    keyword_enabled: number
}

/** 统计分析配置项 */
export interface AnalyticsConfig {
    baidu_tongji_code: string
    baidu_tongji_enabled: number
}

/** 单个菜单项的可见性/权限覆盖（前端路由菜单模式运行期下发） */
export interface MenuVisibilityItem {
    /** 是否可见，false 则从菜单中移除 */
    visible?: boolean
    /** 覆盖后的权限码（字符串或数组） */
    permissions?: string | string[]
    /** 覆盖后是否公开可访问 */
    is_public?: boolean | number
    /** 权限码 */
    code?: string
}

/**
 * 路由菜单模式运行期配置（/site/routing-config）
 * - routing_mode：覆盖构建期默认模式（frontend/backend/hybrid）
 * - menus：backend/hybrid 模式下的后端菜单数据
 * - menu_visibility：前端模式下按 path 覆盖菜单可见性与权限
 */
export interface RoutingConfig {
    routing_mode?: 'frontend' | 'backend' | 'hybrid'
    /** backend/hybrid 模式下的后端菜单列表（已按权限过滤） */
    menus?: any[]
    menu_visibility?: Record<string, MenuVisibilityItem>
    /** PC 导航栏最大显示一级菜单数量（溢出部分收纳到"更多"） */
    max_nav_items?: number
}
