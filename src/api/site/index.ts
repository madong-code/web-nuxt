/**
 * 站点首页模块 API
 *
 * 对应后端：site/AdvertisementController, site/LinkController, site/MenuController, site/SiteController
 */
import request from '~/api/request'
import type { LinkItem, AdvertisementItem, NavigationItem, SiteData } from './types'

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
 * 获取导航菜单列表
 */
export function getNavigationList(): Promise<NavigationItem[]> {
    return request.get('/site/nav')
}

/**
 * 获取站点首页数据（广告、导航、友情链接等）
 */
export function getSiteData(): Promise<SiteData> {
    return request.get('/site/site-data')
}
