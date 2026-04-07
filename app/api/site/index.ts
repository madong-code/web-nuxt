import request from '~/utils/request'
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
 * 获取广告位信息
 */
export function getAdvertisements(params?: { type?: string }): Promise<AdvertisementItem[]> {
    return request.get('/site/ads', params)
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

/**
 * 获取 Web 分组所有配置
 * 一次性获取前台站点设置、搜索配置、统计分析配置等
 */
export function getWebGroupConfigs(): Promise<Record<string, any>> {
    return request.get('/system/config/group/web')
}


