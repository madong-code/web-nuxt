import { defineStore } from 'pinia'
import { getConfigByCode } from '~/api/system'
import { navigateTo } from 'nuxt/app'

/**
 * 登录配置接口定义
 * 用于管理登录相关的配置选项
 */
interface loginConfig {
    is_username: number | boolean,      // 是否启用用户名登录 (1/0 或 true/false)
    is_mobile: number | boolean,        // 是否启用手机号登录 (1/0 或 true/false)
    is_auth_register: number | boolean,  // 是否启用授权注册 (1/0 或 true/false)
    is_bind_mobile: number | boolean,   // 是否启用绑定手机号 (1/0 或 true/false)
    is_wechat_scan: number | boolean,   // 是否启用微信扫描登录 (1/0 或 true/false)
    agreement_show: number | boolean    // 是否显示用户协议 (1/0 或 true/false)
}

/**
 * 多语言配置接口定义
 * 用于管理多语言相关的配置选项
 */
interface languageConfig {
    is_enabled: number | boolean,       // 是否启用多语言支持 (1/0 或 true/false)
    default_lang: string,               // 默认语言代码
    available_langs: string[]           // 可用语言代码数组
}

/**
 * 主题配置接口定义
 * 用于管理主题相关的配置选项
 */
interface themeConfig {
    is_enabled: number | boolean,       // 是否启用主题切换 (1/0 或 true/false)
    default_theme: string,              // 默认主题 (light/dark)
    available_themes: string[]          // 可用主题数组
}

/**
 * 支付配置接口定义
 * 用于管理支付相关的配置选项
 */
interface paymentConfig {
    is_wechat_enabled: number | boolean,  // 是否启用微信支付 (1/0 或 true/false)
    is_alipay_enabled: number | boolean   // 是否启用支付宝支付 (1/0 或 true/false)
}

/**
 * 搜索配置接口定义
 * 用于管理搜索相关的配置选项
 */
interface searchConfig {
    keyword: string,              // 搜索引擎关键字
    keyword_enabled: number | boolean  // 是否启用关键字搜索 (0/1 或 true/false)
}

/**
 * 统计分析配置接口定义
 * 用于管理统计分析相关的配置选项
 */
interface analyticsConfig {
    baidu_tongji_code: string,    // 百度统计代码
    baidu_tongji_enabled: number | boolean // 是否启用百度统计 (0/1 或 true/false)
}

/**
 * 站点设置配置接口定义
 * 用于管理站点基础设置相关的配置选项
 */
interface siteSettingConfig {
    site_open: number,              // 是否开启站点
    site_url: string,               // 站点URL
    site_name: string,              // 站点名称
    site_logo: string,              // 站点Logo
    site_keywords: string,          // 关键词
    site_description: string,       // 描述
    site_copyright: string,         // 版权信息
    site_record_no: string,         // ICP备案号
    site_icp_url: string,           // ICP备案链接
    site_network_security: string,  // 公安备案号
    site_network_security_url: string, // 公安备案链接
    upload_mode?: string,           // 当前存储模式（local/qiniu/oss/cos/s3，由后端追加）
    cdn_url?: string,               // 资源 CDN 域名（本地模式为空串，由后端追加）
    static_url?: string,            // 静态资源 base URL（与 cdn_url 等价，由后端追加）
    is_private?: boolean,      // 是否私有空间（非公开读）：需按 key 调 /file/access-urls 换取地址
    storage_prefix: string,         // 存储根目录名（用于区分存储资源与站点自身静态资源）
}

/**
 * 全局配置接口定义
 * 包含应用的所有配置模块
 */
interface Config {
    login: loginConfig,     // 登录配置模块
    language: languageConfig, // 多语言配置模块
    theme: themeConfig,     // 主题配置模块
    payment: paymentConfig, // 支付配置模块
    search: searchConfig,   // 搜索配置模块
    analytics: analyticsConfig, // 统计分析配置模块
    siteSetting: siteSettingConfig, // 站点设置配置模块
    upload_mode: string,    // 当前存储模式：local 时资源与站点同域，其余用 cdn_url 前缀
    cdn_url: string,        // 资源 CDN 域名（fullUrl 拼接相对路径用，空串表示同域）
    is_private: boolean,      // 是否私有空间（非公开读）
    storage_prefix: string    // 存储根目录名
}

/**
 * 配置状态管理 Store
 * 使用 Pinia 管理应用的全局配置状态
 */
export const useConfigStore = defineStore('config', {
    state: (): Config => {
        return {
            login: {
                is_username: 1,       // 默认启用用户名登录
                is_mobile: 0,         // 默认禁用手机号登录
                is_auth_register: 1,  // 默认启用授权注册
                is_bind_mobile: 0,    // 默认禁用绑定手机号
                is_wechat_scan: 0,    // 默认禁用微信扫描登录
                agreement_show: 0     // 默认不显示用户协议
            },
            language: {
                is_enabled: 0,        // 默认不启用多语言支持
                default_lang: 'zh-cn', // 默认语言为中文
                available_langs: ['zh-cn', 'en'] // 可用语言
            },
            theme: {
                is_enabled: 1,        // 默认启用主题切换
                default_theme: 'light', // 默认主题为浅色
                available_themes: ['light', 'dark'] // 可用主题
            },
            payment: {
                is_wechat_enabled: 1,  // 默认启用微信支付
                is_alipay_enabled: 1   // 默认启用支付宝支付
            },
            search: {
                keyword: '',          // 默认搜索关键字为空
                keyword_enabled: 0    // 默认不启用关键字搜索
            },
            analytics: {
                baidu_tongji_code: '',    // 默认百度统计代码为空
                baidu_tongji_enabled: 0   // 默认不启用百度统计
            },
            siteSetting: {
                site_open: 1,                 // 默认开启站点
                site_url: '',                 // 默认站点URL（留空自动获取）
                site_name: 'madong',          // 默认站点名称
                site_logo: '',                // 默认站点Logo
                site_keywords: '',            // 默认关键词为空
                site_description: '',         // 默认描述为空
                site_copyright: '',           // 默认版权信息为空
                site_record_no: '',           // 默认ICP备案号为空
                site_icp_url: 'https://beian.miit.gov.cn/', // 默认ICP备案链接
                site_network_security: '',    // 默认公安备案号为空
                site_network_security_url: '', // 默认公安备案链接为空
                upload_mode: 'local',         // 默认本地存储（资源与站点同域）
                cdn_url: '',                  // 默认无 CDN，fullUrl 回落 API 域名
                static_url: '',
                is_private: false,            // 默认公开空间（无需换取签名地址）
                storage_prefix: ''
            },
            upload_mode: 'local',  // 默认本地存储
            cdn_url: '',           // 默认无 CDN，fullUrl 回落 API 域名
            is_private: false,     // 默认公开空间
            storage_prefix: ''      // 默认无存储根目录
        }
    },
    actions: {
        /**
         * 获取 Web 分组配置
         * @description 并行获取所有 Web 分组配置（站点设置、搜索、统计分析、登录配置等）
         * @param router - 可选的路由器实例，用于页面跳转控制
         */
        async getWebGroupConfigs(router?: any) {
            try {
                // 并行获取所有配置
                const [
                    loginConfigRes,
                    siteSettingRes,
                    searchConfigRes,
                    analyticsConfigRes,
                    paymentConfigRes
                ] = await Promise.all([
                    getConfigByCode('web_login_config'),
                    getConfigByCode('site_setting'),
                    getConfigByCode('web_search_config'),
                    getConfigByCode('web_analytics_config'),
                    getConfigByCode('web_payment_config')
                ])

                // 更新登录配置
                const loginConfig = loginConfigRes?.data || loginConfigRes || {}
                if (loginConfig && !Array.isArray(loginConfig)) {
                    this.login.is_username = parseInt(loginConfig.is_username)
                    this.login.is_mobile = parseInt(loginConfig.is_mobile)
                    this.login.is_auth_register = parseInt(loginConfig.is_auth_register)
                    this.login.is_bind_mobile = parseInt(loginConfig.is_bind_mobile)
                    this.login.is_wechat_scan = parseInt(loginConfig.is_wechat_scan)
                    this.login.agreement_show = parseInt(loginConfig.agreement_show)

                    // 如果当前在关闭页面且有配置数据，自动跳转到首页
                    if (router && router.currentRoute.value.path === '/site/close') {
                        navigateTo('/', { replace: true })
                    }
                }

                // 更新站点设置（对应后台 site_setting，分组 default）
                const siteSetting = siteSettingRes?.data || siteSettingRes || {}
                if (siteSetting && !Array.isArray(siteSetting)) {
                    this.siteSetting.site_open = siteSetting.site_open ?? 1
                    this.siteSetting.site_url = siteSetting.site_url || (typeof window !== 'undefined' ? window.location.origin : '')
                    this.siteSetting.site_name = siteSetting.site_name || 'madong'
                    this.siteSetting.site_logo = siteSetting.site_logo || ''
                    this.siteSetting.site_keywords = siteSetting.site_keywords || ''
                    this.siteSetting.site_description = siteSetting.site_description || ''
                    this.siteSetting.site_copyright = siteSetting.site_copyright || ''
                    this.siteSetting.site_record_no = siteSetting.site_record_no || ''
                    this.siteSetting.site_icp_url = siteSetting.site_icp_url || 'https://beian.miit.gov.cn/'
                    this.siteSetting.site_network_security = siteSetting.site_network_security || ''
                    this.siteSetting.site_network_security_url = siteSetting.site_network_security_url || ''
                    // 存储模式与 CDN 域名（后端在 site_setting 响应中追加）
                    // 云存储模式下 fullUrl 必须用 CDN 域名拼资源地址，否则会请求站点域名下的本地文件而 404
                    this.siteSetting.upload_mode = siteSetting.upload_mode || 'local'
                    this.siteSetting.cdn_url = siteSetting.cdn_url || ''
                    this.siteSetting.static_url = siteSetting.static_url || ''
                    this.siteSetting.is_private = siteSetting.is_private === true
                    this.siteSetting.storage_prefix = siteSetting.storage_prefix || ''
                    this.upload_mode = this.siteSetting.upload_mode
                    this.cdn_url = this.siteSetting.cdn_url
                    this.is_private = this.siteSetting.is_private
                    this.storage_prefix = this.siteSetting.storage_prefix
                }

                // 更新搜索配置
                const searchConfig = searchConfigRes?.data || searchConfigRes || {}
                if (searchConfig && !Array.isArray(searchConfig)) {
                    this.search.keyword = searchConfig.keyword || ''
                    this.search.keyword_enabled = parseInt(searchConfig.keyword_enabled)
                }

                // 更新统计分析配置
                const analyticsConfig = analyticsConfigRes?.data || analyticsConfigRes || {}
                if (analyticsConfig && !Array.isArray(analyticsConfig)) {
                    this.analytics.baidu_tongji_code = analyticsConfig.baidu_tongji_code || ''
                    this.analytics.baidu_tongji_enabled = parseInt(analyticsConfig.baidu_tongji_enabled)
                }

                // 更新支付配置
                const paymentConfig = paymentConfigRes?.data || paymentConfigRes || {}
                if (paymentConfig && !Array.isArray(paymentConfig)) {
                    this.payment.is_wechat_enabled = parseInt(paymentConfig.is_wechat_enabled)
                    this.payment.is_alipay_enabled = parseInt(paymentConfig.is_alipay_enabled)
                }
            } catch (error) {
                console.error('获取 Web 分组配置失败:', error)
            }
        },

        /**
         * 初始化所有配置
         * @description 一次性获取所有配置信息
         */
        async initAllConfigs(router?: any) {
            await this.getWebGroupConfigs(router)
        }
    }
})

/**
 * 默认导出配置Store
 * 可在组件中使用 useConfigStore() 来访问配置状态
 */
export default useConfigStore
