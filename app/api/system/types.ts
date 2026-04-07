/**
 * 系统配置相关类型定义
 */

/**
 * 配置项
 */
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

/**
 * 站点设置配置
 */
export interface SiteConfig {
    copyright: string
    icp: string
    icp_url: string
    network_security: string
    network_security_url: string
}

/**
 * 协议类型
 */
export type AgreementType = 'user' | 'privacy' | 'service'

/**
 * 短信/邮箱验证码类型
 */
export type SmsType = 'register' | 'login' | 'reset_password' | 'reset_password_email' | 'change_phone' | 'change_email'

