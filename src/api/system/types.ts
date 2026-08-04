/**
 * 系统配置相关类型定义
 */

/** 配置项 */
export interface ConfigItem {
    id: number
    group_code: string
    code: string
    name: string
    content: Record<string, any>
    is_sys: number
    enabled: number
    created_at: number
    updated_at: number
    remark?: string
}

/** 站点设置配置（对应后台 site_setting，分组 default，字段为 site_* 前缀） */
export interface SiteConfig {
    site_open: number
    site_url: string
    site_name: string
    site_logo: string
    site_keywords: string
    site_description: string
    site_copyright: string
    site_record_no: string
    site_icp_url: string
    site_network_security: string
    site_network_security_url: string
}

/** 协议类型 */
export type AgreementType = 'user' | 'privacy' | 'service'

/** 短信/邮箱验证码类型 */
export type SmsType = 'register' | 'login' | 'reset_password' | 'reset_password_email' | 'change_phone' | 'change_email'

/** 验证码图片响应 */
export interface CaptchaImageResponse {
    captcha_key: string
    captcha_code: string
}

/** 协议内容响应 */
export interface AgreementContent {
    key: string
    title: string
    content: string
    version: string
    updated_at: number
}

/** 分组配置响应 */
export interface ConfigGroupResponse {
    group_code: string
    group_name: string
    items: ConfigItem[]
}
