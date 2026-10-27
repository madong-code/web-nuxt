import { fetchWebSiteConfig, type WebSiteConfig } from '~/api/site'

/** 文件默认值（与后端站点配置默认对齐），接口失败时兜底 */
const DEFAULT_SITE_CONFIG: WebSiteConfig = {
    site_name: 'Madong Portal',
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
 * 站点全局配置（页脚版权 / 备案 / 入口开关）
 * 共享 key：布局层 await 保证 SSR 直出，页脚组件直接消费
 *
 * 客户端自愈：SSR 端接口失败会把默认配置固化进 payload（表现为线上默认站名
 * "Madong Portal"），客户端检测到默认站名时重拉一次恢复真实配置。
 */
export function useSiteConfig() {
    const { data: siteCfg, refresh, status } = useAsyncData<WebSiteConfig>(
        'site-config',
        () => fetchWebSiteConfig().catch(() => ({ ...DEFAULT_SITE_CONFIG })),
        { default: () => ({ ...DEFAULT_SITE_CONFIG }) },
    )

    // 客户端自愈：SSR 失败会把默认配置固化进 payload（站名退化为 "Madong Portal"），
    // onMounted 时直接重拉一次并手动写入 data ref，恢复真实站点配置。
    if (import.meta.client) {
        onMounted(async () => {
            if (siteCfg.value?.site_name !== DEFAULT_SITE_CONFIG.site_name) return
            try {
                const res = await fetchWebSiteConfig()
                if (res?.site_name) {
                    siteCfg.value = res
                }
            } catch {
                // 自愈失败保持默认兜底，不打断页面
            }
        })
    }

    return { data: siteCfg, refresh, status }
}
