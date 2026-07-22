/**
 * 客户端初始化插件：提前加载站点信息与菜单数据
 *
 * 必须在 auth 中间件之前执行，确保中间件中的 backendMenuCodes 校验可用。
 * Nuxt 生命周期：Plugins → Middleware → Page setup → onMounted
 *
 * 注意：此插件必须为 .client.ts，因为 getSiteInfoFn 依赖浏览器 API。
 * 本项目 ssr:false，此 .client 插件始终在客户端执行；
 * 在页面导航前补充执行一次路由有效性检查（兜底插件加载前的直达访问）。
 */
export default defineNuxtPlugin(async () => {
    const systemStore = useSystemStore()
    if (!systemStore.isInitialized) {
        await systemStore.getSiteInfoFn()
    }
    // 初始化语言设置
    systemStore.initLanguage()

    // 客户端 hydration 后：检查当前路由是否在后端菜单中注册
    // SSR 时 isInitialized=false 会导致中间件跳过 backendMenuCodes 校验，
    // 因此需要在此处做一次兜底检查
    const route = useRoute()
    const meta = route.meta as Record<string, any>
    const isPublic = meta.is_public !== false && meta.is_public !== 0 && meta.is_public !== '0'

    if (!isPublic && systemStore.routingMode !== 'frontend') {
        // is_no_auth=true → 跳过后端 code 校验
        const isNoAuth = meta.is_no_auth === true || meta.is_no_auth === 1 || meta.is_no_auth === '1'
        if (isNoAuth) {
            return
        }

        const routeCode = meta.code as string | undefined
        // code 未定义或显式为 '' → 只需登录，跳过校验
        if (routeCode !== undefined && routeCode !== '') {
            if (!systemStore.isValidBackendMenuCode(routeCode)) {
                showError(createError({ statusCode: 404, statusMessage: 'Page Not Found' }))
            }
        }
    }
})
