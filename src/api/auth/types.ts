/**
 * 认证模块相关类型定义
 */

/** 登录数据 */
export interface LoginData {
    username?: string
    password?: string
    phone?: string
    verify_code?: string
    pid?: string
}

/** 登录响应 */
export interface LoginResponse {
    access_token: string
    refresh_token: string
    expires_in?: number
    user_info?: UserInfo
    /** 登录时下发的权限码列表 */
    permissions?: string[]
}

/** 注册数据 */
export interface RegisterData {
    username?: string
    password?: string
    phone?: string
    verify_code?: string
    pid?: string
}

/** 绑定手机号数据 */
export interface BindMobileData {
    mobile: string
    code: string
    pid?: string
}

/** 用户信息 */
export interface UserInfo {
    id: number | string
    username: string
    nickname?: string
    avatar?: string
    phone?: string
    email?: string
    token?: string
    /** 权限码列表 */
    permissions?: string[]
}

/** 登录配置 */
export interface LoginConfig {
    enable_username_login: boolean
    enable_mobile_login: boolean
    enable_wechat_login: boolean
    enable_weapp_login: boolean
    enable_register: boolean
}

/** 扫码状态 */
export enum ScanStatus {
    WAITING = 'waiting',
    SCANNED = 'scanned',
    CONFIRMED = 'confirmed',
    EXPIRED = 'expired',
    CANCELED = 'canceled'
}

/** 第三方平台类型 */
export enum ThirdPartyPlatform {
    WECHAT = 1,
    QQ = 2,
    ALIPAY = 3
}

/** 第三方绑定信息 */
export interface ThirdPartyBinding {
    platform: number
    platform_name: string
    nickname?: string
    avatar?: string
    bind_time: number
}

/** 扫码登录信息 */
export interface QrCodeLoginInfo {
    scene_id: string
    qrcode_url: string
    expires_in: number
}

/** 微信 JSSDK 配置 */
export interface WechatJssdkConfig {
    app_id: string
    timestamp: number
    nonce_str: string
    signature: string
}
