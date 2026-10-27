/**
 * 站点首页模块 API
 *
 * 对应后端：site/AdvertisementController, site/LinkController, site/SiteController
 */
import request from '~/api/request'
import type { LinkItem, AdvertisementItem, NavConfigData, WebSiteConfig } from './types'

// 前台导航/站点配置类型对外再导出（layouts/composables 消费）
export type { NavMenuItem, NavConfigData, WebSiteConfig } from './types'

/**
 * 获取友情链接列表
 */
export function getLinks(params?: { type?: string }): Promise<LinkItem[]> {
    return request.get('/site/link', params)
}

/**
 * 获取所有友情链接
 */
export function getAllLinks(): Promise<LinkItem[]> {
    return request.get('/site/link/all')
}

/**
 * 获取广告列表
 */
export function getAdvertisements(params?: { type?: string }): Promise<AdvertisementItem[]> {
    return request.get('/site/ads', params)
}

/**
 * 获取广告位信息
 */
export function getAdPositionInfo(params?: { type?: string }): Promise<AdvertisementItem> {
    return request.get('/site/ads/info', params)
}

/**
 * 站点导航配置（唯一导航数据源；登录态无关整体输出，前端按登录态过滤显隐）
 * 合并原 /site/routing-config 与 /portal/channel/nav：
 * routing_mode/menu_visibility/max_nav_items/codes + 四类全量菜单树
 */
export function fetchNavConfig(): Promise<NavConfigData> {
    return request.get('/site/nav-config')
}

/**
 * 站点全局配置（公开；页脚版权/备案/入口开关/百度统计/会员开关透出）
 * 上收自 portal（/portal/site-config 已删），读 sys_config site_setting 映射为 WebSiteConfig
 */
export function fetchWebSiteConfig(): Promise<WebSiteConfig> {
    return request.get('/site/site-config')
}

/**
 * 申请友情链接（页脚；落库为待审核，后台「网站设置→友情链接」启用后展示）
 */
export function applyFriendlink(data: {
    name: string
    url: string
    logo?: string
    description?: string
    contact?: string
}): Promise<void> {
    return request.post('/site/link/apply', data)
}
