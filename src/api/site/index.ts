/**
 * 站点首页模块 API
 *
 * 对应后端：site/AdvertisementController, site/LinkController, site/SiteController
 */
import request from '~/api/request'
import type { LinkItem, AdvertisementItem } from './types'
import type { RoutingConfig } from './types'

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
 * 获取路由菜单模式运行期配置
 * 用于覆盖构建期默认模式，以及前端模式下下发菜单可见性/权限
 */
export function getRoutingConfig(): Promise<RoutingConfig> {
    return request.get('/site/routing-config')
}
