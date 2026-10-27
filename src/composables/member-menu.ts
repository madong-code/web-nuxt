import { computed } from 'vue'
import type { Component } from 'vue'
import {
    Bell,
    CircleUser,
    Crown,
    FileText,
    KeyRound,
    LayoutDashboard,
    MessageSquare,
    MessageSquareMore,
    ReceiptText,
    Star,
    Store,
    Users,
} from 'lucide-vue-next'
import type { NavMenuItem } from '~/api/site'
import { useNotifyStore } from '~/stores/notify'

/**
 * 会员菜单共享能力（头像下拉 / 个人中心 tag 导航 / 概述入口卡共用）：
 * - 数据源统一为 useNav() 的 member_menus（web_menu category=2，已按登录态/权限码过滤）
 * - 可见性 = useNav 登录态过滤，前端唯一叠加过滤是
 *   会员套餐业务开关（portal_site.membership_enabled）
 * - 其他插件按菜单协议接入（pid_code 挂目录 + migrate-plugin-menu）后自动出现
 */

/** web_menu.icon 图标名 → 组件映射（覆盖会员菜单实际用到的 lucide 名；未知名回退 CircleUser） */
export const MEMBER_ICONS: Record<string, Component> = {
    LayoutDashboard,
    CircleUser,
    FileText,
    Star,
    MessageSquare,
    ReceiptText,
    KeyRound,
    Store,
    Bell,
    MessageSquareMore,
    Crown,
    Users,
}

export function resolveMemberIcon(name?: string): Component {
    return (name && MEMBER_ICONS[name]) || CircleUser
}

/** 会员入口 URL（含旧 tab= 形式与新版 /member/membership） */
export function isMembershipUrl(url: string): boolean {
    return /(^|[?&])tab=membership(&|$)/.test(url) || /\/member\/membership([/?]|$)/.test(url)
}

/** 递归过滤会员菜单树（当前仅 membership 业务开关；返回浅拷贝，不改原树） */
export function filterMemberTree(
    list: NavMenuItem[] | undefined,
    membershipEnabled?: boolean | null,
): NavMenuItem[] {
    const out: NavMenuItem[] = []
    for (const m of list ?? []) {
        if (isMembershipUrl(m.url || '') && !membershipEnabled) continue
        out.push({ ...m, children: filterMemberTree(m.children, membershipEnabled) })
    }
    return out
}

/** 分组是否包含目标路由（按 url 去查询串后前缀匹配，递归整棵子树） */
export function memberGroupMatches(group: NavMenuItem, path: string): boolean {
    const walk = (n: NavMenuItem): boolean => {
        const url = (n.url || '').split('?')[0]
        if (url && url !== '/' && (path === url || path.startsWith(`${url}/`) || path.startsWith(`${url}?`))) {
            return true
        }
        return (n.children ?? []).some(walk)
    }
    return walk(group)
}

/** 页面节点是否为当前路由（下拉菜单项精确匹配） */
export function memberItemActive(url: string, path: string): boolean {
    const clean = (url || '').split('?')[0]
    return !!clean && path === clean
}

/**
 * 未读徽章通用消费层（对接接口）：
 * - 数据源 = stores/notify（store 模式，徽章唯一数据源），任何插件两种接入方式
 *   均无需改框架/消费端，头像下拉 / 个人中心 tag 导航 / 移动抽屉 / 概述卡按 URL 自动挂徽章：
 *   · 被动轮询：registerNotifyProvider({ key, fetchUnread, mode })，核心按节奏拉取
 *   · 主动驱动：useNotifyStore().setCount / incr / decr / clear 直接写未读数
 *   · key 推荐与会员菜单 url 一致（如 '/notify'、'/messages'、'/my-orders'）
 *   · mode='count'（默认）数字徽章并计入头像未读总数；mode='dot' 红点提示
 * - 旧版 tab=notify / tab=messages 链接保持兼容
 */
export function useMemberBadges() {
    const notifyStore = useNotifyStore()

    const formatBadge = (n: number): string => (n > 0 ? (n > 99 ? '99+' : String(n)) : '')
    const countOf = (key: string) => Number(notifyStore.providerCounts[key]) || 0
    const findProvider = (key: string) => notifyStore.getProviders().find(p => p.key === key)

    /**
     * 菜单 url → 徽章 key（去查询串精确/前缀匹配 + 旧 tab= 形式兼容）。
     * 匹配域 = 已注册 provider key ∪ providerCounts 已有 key：
     * 主动驱动（setCount）而未注册 provider 的 key 也能按 URL 挂上徽章。
     */
    function keyForUrl(url: string): string | null {
        if (!url) return null
        if (/(^|[?&])tab=notify(&|$)/.test(url)) return '/notify'
        if (/(^|[?&])tab=messages(&|$)/.test(url)) return '/messages'
        const clean = url.split('?')[0]
        const keys = [
            ...notifyStore.getProviders().map(p => p.key),
            ...Object.keys(notifyStore.providerCounts),
        ]
        for (const key of keys) {
            if (key === clean || clean.startsWith(`${key}/`) || clean.startsWith(`${key}?`)) {
                return key
            }
        }
        return null
    }

    /** 数字徽章文本（count 模式；dot 模式恒空串由 dotForUrl 呈现） */
    function badgeForUrl(url: string): string {
        const key = keyForUrl(url)
        if (!key) return ''
        const provider = findProvider(key)
        if (provider && provider.mode === 'dot') return ''
        return formatBadge(countOf(key))
    }

    /** 红点提示（dot 模式且有未读） */
    function dotForUrl(url: string): boolean {
        const key = keyForUrl(url)
        if (!key) return false
        const provider = findProvider(key)
        return (provider?.mode ?? 'count') === 'dot' && countOf(key) > 0
    }

    const notifyCount = computed(() => countOf('/notify'))
    const messageCount = computed(() => countOf('/messages'))
    const notifyBadge = computed(() => formatBadge(notifyCount.value))
    const messageBadge = computed(() => formatBadge(messageCount.value))

    /** 头像总未读 = store 聚合 getter（count 模式合计，dot 不计入；聚合内聚在 notify store） */
    const totalUnread = computed(() => notifyStore.totalUnread)
    /** 是否存在 dot 模式未读（头像右下角呼吸点条件之一） */
    const hasDotUnread = computed(() => notifyStore.hasDotUnread)

    return { notifyCount, messageCount, notifyBadge, messageBadge, totalUnread, hasDotUnread, badgeForUrl, dotForUrl }
}

/** 移动端抽屉用的扁平行结构（目录=分组标题缩进平铺） */
export interface MemberRow {
    label: string
    to: string
    external: boolean
    depth: number
    icon: Component | null
    badge: string
    /** 红点提示（dot 模式 provider 有未读） */
    dot: boolean
}

export function flattenMemberRows(
    list: NavMenuItem[] | undefined,
    badgeForUrl: (url: string) => string,
    dotForUrl: (url: string) => boolean,
): MemberRow[] {
    const rows: MemberRow[] = []
    const walk = (nodes: NavMenuItem[] | undefined, depth: number) => {
        for (const m of nodes ?? []) {
            const url = m.url || ''
            if (!url) {
                rows.push({ label: m.name, to: '', external: false, depth, icon: null, badge: '', dot: false })
                walk(m.children, depth)
                continue
            }
            rows.push({
                label: m.name,
                to: url,
                external: !!m.external,
                depth,
                icon: resolveMemberIcon(m.icon),
                badge: badgeForUrl(url),
                dot: dotForUrl(url),
            })
            if (m.children?.length) walk(m.children, depth + 1)
        }
    }
    walk(list, 0)
    return rows
}
