/**
 * SSR 端站点初始化插件：服务端渲染期间预加载站点信息与菜单数据
 *
 * 与 init-site.client.ts 配对：SSR 请求阶段即通过全局 store 完成
 * nav_menu / member_menu / header_actions / footer_menu 与站点配置的
 * 预加载与初始化，随 payload 注水到客户端；客户端插件靠
 * systemStore.isInitialized 短路，不会重复请求。
 *
 * 彻底根除「页面刷新后导航配置丢失 / SSR 直出缺导航与站点名」问题
 * （详见 specs/web-menu-portal-tuning/spec.md §2.4 / §5.4）。
 */
export default defineNuxtPlugin(async () => {
    const systemStore = useSystemStore()
    if (!systemStore.isInitialized) {
        await systemStore.getSiteInfoFn()
    }
})
