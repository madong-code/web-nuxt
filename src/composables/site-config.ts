import { fetchWebSiteConfig, type WebSiteConfig } from '~/api/site'

/** 前端静态默认 Logo（Nuxt public/logo.png，后端 logo.png 也由 webman 静态服务） */
const DEFAULT_SITE_LOGO = '/logo.png'

/**
 * 完整兜底配置（后端无配置数据 / 接口失败时使用）
 *
 * site_name 空：由 buildFallbackConfig 注入 env 值
 * site_logo 空：默认 /logo.png（Nuxt public 目录或后端 public/logo.png）
 * 其余字段对齐后端 SiteConfigService 默认值
 */
const DEFAULT_SITE_CONFIG: WebSiteConfig = {
    site_name: '',
    site_logo: DEFAULT_SITE_LOGO,
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
 * 站点名称兜底值：env NUXT_PUBLIC_SITE_NAME → 'Madong'
 * ⚠️ 仅可在 Nuxt 上下文内同步调用（setup / 插件 / 中间件），不得出现在
 * useAsyncData handler、await 之后或事件回调中，否则 useRuntimeConfig 报错。
 */
export function fallbackSiteName(): string {
    return (useRuntimeConfig().public.SITE_NAME as string) || 'Madong'
}

/** 组装兜底配置（站名由调用方在同步上下文读好后传入） */
function buildFallbackConfig(siteName: string): WebSiteConfig {
    return { ...DEFAULT_SITE_CONFIG, site_name: siteName, site_logo: DEFAULT_SITE_LOGO }
}

/**
 * 强制覆盖后端返回配置中的空值字段：
 * - site_name 空 → env SITE_NAME 兜底
 * - site_logo 空 → /logo.png 兜底
 * - 其余字段后端有值则保留，空则用 DEFAULT_SITE_CONFIG 默认值
 *
 * 无论后端返回什么（包括空值），都必须执行覆盖逻辑——
 * 避免历史缓存/跨租户残留导致的脏数据穿透到前端渲染层。
 */
function forceFillEmptyFields(raw: any, fallbackName: string): WebSiteConfig {
    const res = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {} as Record<string, any>
    const merged: WebSiteConfig = { ...DEFAULT_SITE_CONFIG }

    // 逐字段覆盖，空值/缺失均兜底
    merged.site_name = (res.site_name && String(res.site_name).trim() !== '')
        ? String(res.site_name).trim()
        : fallbackName
    merged.site_logo = (res.site_logo && String(res.site_logo).trim() !== '')
        ? String(res.site_logo).trim()
        : DEFAULT_SITE_LOGO
    merged.copyright = (res.copyright ?? '') || ''
    merged.icp_number = (res.icp_number ?? '') || ''
    merged.icp_url = (res.icp_url && String(res.icp_url).trim() !== '')
        ? String(res.icp_url).trim()
        : 'https://beian.miit.gov.cn/'
    merged.police_number = (res.police_number ?? '') || ''
    merged.police_url = (res.police_url && String(res.police_url).trim() !== '')
        ? String(res.police_url).trim()
        : 'https://beian.mps.gov.cn/'
    merged.show_apply = (typeof res.show_apply === 'boolean') ? res.show_apply : true
    merged.show_powered = (typeof res.show_powered === 'boolean') ? res.show_powered : true
    merged.contact_email = (res.contact_email ?? '') || ''
    merged.tongji_enabled = (typeof res.tongji_enabled === 'boolean') ? res.tongji_enabled : false
    merged.tongji_key = (res.tongji_key ?? '') || ''
    merged.membership_enabled = (typeof res.membership_enabled === 'boolean') ? res.membership_enabled : false

    return merged
}

/**
 * 站点全局配置（站点名 / logo / 页脚版权备案 / 入口开关）
 * 共享 key：布局层 await 保证 SSR 直出，页脚组件直接消费
 *
 * 兜底链（每一环都强制覆盖，即使前一环返回空值）：
 *   site_name: 后端配置 → env NUXT_PUBLIC_SITE_NAME → 'Madong'
 *   site_logo: 后端配置 → /logo.png（Nuxt public 默认资源）
 *
 * 每次 fetch 都强制执行 forceFillEmptyFields，确保：
 *   ✅ 后端返回空值时必须填入兜底，不跳过；
 *   ✅ 跨租户切换后旧租户缓存不会残留；
 *   ✅ 重启后端 / 切换租户配置后立即生效，无历史缓存污染。
 */
export function useSiteConfig() {
    // setup 同步阶段读取一次 env 值，后续异步回调仅使用闭包值
    const fallbackName = fallbackSiteName()
    const { data: siteCfg, refresh, status } = useAsyncData<WebSiteConfig>(
        'site-config',
        () => fetchWebSiteConfig()
            // 即使接口成功也强制覆盖空值（forceFillEmptyFields 每次都跑一遍）
            .then((res) => forceFillEmptyFields(res, fallbackName))
            // 接口失败：直接用完整兜底配置（含 env 站名 + 默认 logo）
            .catch(() => buildFallbackConfig(fallbackName)),
        { default: () => buildFallbackConfig(fallbackName) },
    )

    // 客户端自愈 + 强制刷新：
    // SSR 端接口返回后会把结果固化进 payload，客户端需要重拉一次确保：
    // ① 后端已重启 / 缓存已清后拿到最新值；
    // ② 跨租户切换后用当前租户的配置覆盖 SSR 缓存的旧值；
    // ③ 即使后端仍返回空值，forceFillEmptyFields 也会兜底，不闪变。
    if (import.meta.client) {
        onMounted(async () => {
            try {
                const fresh = await fetchWebSiteConfig()
                // 每次都强制覆盖，即使返回空值也执行兜底链
                siteCfg.value = forceFillEmptyFields(fresh, fallbackName)
            } catch {
                // 自愈失败保持当前配置（兜底值或 SSR 返回值），不打断页面
            }
        })
    }

    return { data: siteCfg, refresh, status }
}
