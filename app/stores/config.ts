import { defineStore } from 'pinia'
import { getWebGroupConfigs } from '~/api/site'
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
    copyright: string,            // 版权信息
    icp: string,                  // ICP备案号
    icp_url: string,              // ICP备案链接
    network_security: string,     // 公安备案号
    network_security_url: string, // 公安备案链接

    // SEO配置数组数据
    seo_title: string,            // SEO标题
    seo_keywords: string[],       // SEO关键词数组
    seo_description: string,      // SEO描述
    site_name: string,            // 站点名称
    site_url: string,             // 站点URL
    share_image: string,          // 分享图片
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
    siteSetting: siteSettingConfig // 站点设置配置模块
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
                is_enabled: 1,        // 默认启用多语言支持
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
                copyright: '',           // 默认版权信息为空
                icp: '',                 // 默认ICP备案号为空
                icp_url: 'https://beian.miit.gov.cn/', // 默认ICP备案链接
                network_security: '',    // 默认公安备案号为空
                network_security_url: '', // 默认公安备案链接为空

                // SEO配置默认值
                seo_title: 'madong',               // 默认SEO标题
                seo_keywords: ['madong', 'madong-admin', 'madong工作流'], // 默认SEO关键词数组
                seo_description: 'madong通用快速开发框架是一个基于Vue3 + TypeScript + ElementPlus的快速开发框架，提供了一个完整的后台管理系统模板', // 默认SEO描述
                site_name: 'madong',                // 默认站点名称
                site_url: '',                         // 默认站点URL（留空自动获取）
                share_image: '/images/share-default.png' // 默认分享图片
            }
        }
    },
    actions: {
        /**
         * 获取 Web 分组配置
         * @description 一次性获取所有 Web 分组配置（站点设置、搜索、统计分析、登录配置等）
         * @param router - 可选的路由器实例，用于页面跳转控制
         */
        async getWebGroupConfigs(router?: any) {
            try {
                const response = await getWebGroupConfigs()
                const data = response?.data || response || {}

                // 更新登录配置
                if (data.web_login_config && !Array.isArray(data.web_login_config)) {
                    this.login.is_username = parseInt(data.web_login_config.is_username)
                    this.login.is_mobile = parseInt(data.web_login_config.is_mobile)
                    this.login.is_auth_register = parseInt(data.web_login_config.is_auth_register)
                    this.login.is_bind_mobile = parseInt(data.web_login_config.is_bind_mobile)
                    this.login.is_wechat_scan = parseInt(data.web_login_config.is_wechat_scan)
                    this.login.agreement_show = parseInt(data.web_login_config.agreement_show)

                    // 如果当前在关闭页面且有配置数据，自动跳转到首页
                    if(data.web_login_config && router && router.currentRoute.value.path === '/site/close'){
                        navigateTo('/', { replace: true })
                    }
                }

                // 更新站点设置
                if (data.web_site_setting && !Array.isArray(data.web_site_setting)) {
                    this.siteSetting.copyright = data.web_site_setting.copyright || ''
                    this.siteSetting.icp = data.web_site_setting.icp || ''
                    this.siteSetting.icp_url = data.web_site_setting.icp_url || 'https://beian.miit.gov.cn/'
                    this.siteSetting.network_security = data.web_site_setting.network_security || ''
                    this.siteSetting.network_security_url = data.web_site_setting.network_security_url || ''
                    
                    // 更新SEO配置（支持数组形式）
                    this.siteSetting.seo_title = data.web_site_setting.seo_title || 'madong 通用快速框架'
                    this.siteSetting.seo_keywords = data.web_site_setting.seo_keywords || ['madong', 'madong-admin', 'ingenious','工作流引擎']
                    this.siteSetting.seo_description = data.web_site_setting.seo_description || '专业开源服务平台'
                    this.siteSetting.site_name = data.web_site_setting.site_name || 'madong'
                    this.siteSetting.site_url = data.web_site_setting.site_url || (typeof window !== 'undefined' ? window.location.origin : '')
                    this.siteSetting.share_image = data.web_site_setting.share_image || '/images/share-default.png'
                }

                // 更新搜索配置 
                if (data.web_search_config && !Array.isArray(data.web_search_config)) {
                    this.search.keyword = data.web_search_config.keyword || ''
                    this.search.keyword_enabled = parseInt(data.web_search_config.keyword_enabled)
                }

                // 更新统计分析配置
                if (data.web_analytics_config && !Array.isArray(data.web_analytics_config)) {
                    this.analytics.baidu_tongji_code = data.web_analytics_config.baidu_tongji_code || ''
                    this.analytics.baidu_tongji_enabled = parseInt(data.web_analytics_config.baidu_tongji_enabled)
                }

                // 可继续添加其他配置的处理
                // 如有新的 web 分组配置，在此添加
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
