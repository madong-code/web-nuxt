import { fetchWebSiteConfig, type WebSiteConfig } from '~/api/site'

/** 非站名默认值（与后端站点配置默认对齐），接口失败时兜底 */
const DEFAULT_SITE_CONFIG: WebSiteConfig = {
    site_name: '',
    site_logo: '',
    copyright: '',
    icp_number: '',
    icp_url: 'https://beian.miit.gov.cn/',
    police_number: '',
    police_url: 'https://beian.mps.gov.cn/',
    show_apply: true,
    show_powered: true,
    contact_email: '405784684@qq.com',
    tongji_enabled: false,
    tongji_key: '',
    membership_enabled: false,
}

/**
 * 站点名称兜底值：env NUXT_PUBLIC_SITE_NAME（重新安装后新库无站点配置时使用）
 * ⚠️ 仅可在 Nuxt 上下文内同步调用（setup / 插件 / 中间件），不得出现在
 * useAsyncData handler、await 之后或事件回调中，否则 useRuntimeConfig 报错。
 */
export function fallbackSiteName(): string {
    return (useRuntimeConfig().public.SITE_NAME as string) || 'MaDong'
}

/** 组装兜底配置（站名由调用方在同步上下文读好后传入，避免异步上下文丢失 Nuxt 实例） */
function buildFallbackConfig(siteName: string): WebSiteConfig {
    return { ...DEFAULT_SITE_CONFIG, site_name: siteName }
}

/**
 * 站点全局配置（站点名 / 页脚版权备案 / 入口开关）
 * 共享 key：布局层 await 保证 SSR 直出，页脚组件直接消费
 *
 * 站名兜底链：后端配置 → env NUXT_PUBLIC_SITE_NAME → 'MaDong'
 *
 * 客户端自愈：SSR 端接口失败会把兜底配置固化进 payload，客户端检测到兜底站名时
 * 重拉一次恢复真实配置（后端始终无配置时保持 env 站名，不闪变）。
 */
export function useSiteConfig() {
    // setup 同步阶段读取一次，后续异步回调仅使用闭包值
    const fallbackName = fallbackSiteName()
    const { data: siteCfg, refresh, status } = useAsyncData<WebSiteConfig>(
        'site-config',
        () => fetchWebSiteConfig()
            // 后端无配置数据（重新安装后新库 site_name 为空）或接口失败时，均回退 env 站名
            .then((res) => (res?.site_name ? res : buildFallbackConfig(fallbackName)))
            .catch(() => buildFallbackConfig(fallbackName)),
        { default: () => buildFallbackConfig(fallbackName) },
    )

    // 客户端自愈：SSR 失败/后端未返回时 payload 固化为兜底配置（站名为 env 兜底值），
    // onMounted 时直接重拉一次并手动写入 data ref，恢复真实站点配置。
    if (import.meta.client) {
        onMounted(async () => {
            if (siteCfg.value?.site_name !== fallbackName) return
            try {
                const res = await fetchWebSiteConfig()
                if (res?.site_name) {
                    siteCfg.value = res
                }
            } catch {
                // 自愈失败保持 env 兜底站名，不打断页面
            }
        })
    }

    return { data: siteCfg, refresh, status }
}
