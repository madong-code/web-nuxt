/**
 * 动态模块（chunk）加载失败自动恢复：
 * - 开发期 Vite 冷启动/依赖预优化窗口内，路由懒加载组件可能瞬时拉取失败，
 *   列表页水合中断 → 服务端渲染的 DOM 未挂事件监听，表现为卡片点击无反应；
 * - 生产期重新发版后，旧页面引用的 hash chunk 已被清理，同样出现
 *   "Failed to fetch dynamically imported module"，应用内跳转静默失败。
 * 兜底策略：捕获后对目标路由做一次整页重载（短时冷却去重防循环），
 * 重载后拿到最新 HTML/chunk，事件监听与路由恢复正常。
 */
export default defineNuxtPlugin((nuxtApp) => {
    const RELOAD_KEY = 'portal:chunk-reload'
    const RELOAD_COOLDOWN = 8000

    const CHUNK_ERROR_FRAGMENTS = [
        'Failed to fetch dynamically imported module',
        'Importing a module script failed',
        'error loading dynamically imported module',
        'Failed to load module script',
        'Loading CSS chunk',
    ]

    function isChunkError(error: unknown): boolean {
        const msg = String((error as Error)?.message ?? error ?? '')
        return CHUNK_ERROR_FRAGMENTS.some(frag => msg.includes(frag))
    }

    function reloadOnce(target: string) {
        try {
            const prev = JSON.parse(sessionStorage.getItem(RELOAD_KEY) || 'null')
            if (prev?.target === target && Date.now() - prev.at < RELOAD_COOLDOWN) return
            sessionStorage.setItem(RELOAD_KEY, JSON.stringify({ target, at: Date.now() }))
        } catch {
            // sessionStorage 不可用（隐私模式等）时跳过去重，仍执行恢复
        }
        window.location.assign(target)
    }

    function register(r: { onError?: (cb: (error: unknown, to?: { fullPath?: string }) => void) => void }) {
        r.onError?.((error, to) => {
            if (!isChunkError(error)) return
            reloadOnce(to?.fullPath ?? window.location.pathname)
        })
    }

    const router = (nuxtApp as any).$router
    if (router) {
        register(router)
    } else {
        // 极端时序兜底：路由插件尚未就绪时等挂载完成再注册
        nuxtApp.hook('app:created', () => {
            const late = (nuxtApp as any).$router
            if (late) register(late)
        })
    }

    // 初始加载/预加载阶段：Vite 预加载失败事件（含 CSS chunk），接管默认行为定向重载
    window.addEventListener('vite:preloadError', (event) => {
        event.preventDefault()
        reloadOnce(window.location.href)
    })
})
