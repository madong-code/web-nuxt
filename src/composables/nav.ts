import { computed, onMounted } from 'vue'
import { fetchNavConfig, type NavConfigData, type NavMenuItem } from '~/api/site'
import { useMemberStore } from '~/stores/member'

/**
 * 前台导航配置（唯一数据源 /site/nav-config，完全以 web 后台菜单管理 md_web_menu 为准）
 *
 * 接口登录态无关、整体输出（可缓存/SSR 直出）：每个节点携带 is_public（显隐语义，
 * 非权限语义；页面保护由路由 auth 中间件负责），此处按登录态响应式过滤显隐——
 * 登录/登出免重拉，computed 依赖 memberStore.info 自动重算，无时序竞态。
 *
 * SSR 共享 key：布局层 await 保证首屏直出，客户端 payload 注水无空导航闪烁；
 * 接口失败兜底为空树（头部仍可渲染 Logo/搜索，不白屏）。
 */
const EMPTY_NAV: NavConfigData = { menus: [], member_menus: [] }

/** 节点对当前登录态是否可见（对齐后端历史过滤语义：公开/登录/权限码三层） */
function isNodeVisible(node: NavMenuItem, isLoggedIn: boolean, userPerms: string[]): boolean {
    // is_public=1 → 公开，所有访客可见
    if (node.is_public) return true
    // 非公开 → 必须登录
    if (!isLoggedIn) return false
    // is_no_auth=1 → 已登录即可
    if (node.is_no_auth) return true
    const code = (node.code || '').trim()
    // 无权限码 → 已登录即可
    if (!code) return true
    // 有权限码 → 用户持有（或超级权限 *）
    const required = code.split(',').map(p => p.trim()).filter(Boolean)
    return userPerms.includes('*') || required.some(p => userPerms.includes(p))
}

/** 递归过滤导航树（返回新数组，不改原树） */
function filterNavTree(
    nodes: NavMenuItem[] | undefined,
    isLoggedIn: boolean,
    userPerms: string[],
): NavMenuItem[] {
    const out: NavMenuItem[] = []
    for (const node of nodes ?? []) {
        if (!isNodeVisible(node, isLoggedIn, userPerms)) continue
        out.push({ ...node, children: filterNavTree(node.children, isLoggedIn, userPerms) })
    }
    return out
}

export function useNav() {
    const { data: raw, refresh, status } = useAsyncData<NavConfigData | null>(
        'site-nav',
        () => fetchNavConfig().catch(() => null),
        { default: () => null },
    )

    // SSR 拉取失败/超时的客户端自愈：挂载后若四棵树全空则重拉一次，
    // 避免单次 SSR 网络抖动导致整页空导航（对齐 site-config 的 onMounted 自愈模式）
    if (import.meta.client) {
        onMounted(() => {
            const cfg = raw.value
            const empty = !cfg
                || !(cfg.menus?.length
                    || cfg.member_menus?.length
                    || cfg.header_actions?.length
                    || cfg.footer_menus?.length)
            if (empty) refresh()
        })
    }

    // 登录态响应式过滤：menus/member_menus 等全量树按当前登录态与权限码裁剪
    const data = computed<NavConfigData>(() => {
        const cfg = raw.value ?? EMPTY_NAV
        const memberStore = useMemberStore()
        const isLoggedIn = !!memberStore.info
        const userPerms: string[] = memberStore.info?.permissions || []
        return {
            ...cfg,
            menus: filterNavTree(cfg.menus, isLoggedIn, userPerms),
            member_menus: filterNavTree(cfg.member_menus, isLoggedIn, userPerms),
            header_actions: filterNavTree(cfg.header_actions, isLoggedIn, userPerms),
            footer_menus: filterNavTree(cfg.footer_menus, isLoggedIn, userPerms),
        }
    })

    return { data, refresh, status }
}
