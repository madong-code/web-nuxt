/**
 * 认证模块 API
 *
 * 对应后端：auth/AuthController, auth/ThirdPartyAuthController, auth/WechatController
 */
import request from '~/api/request'
import type {
    LoginData,
    LoginResponse,
    RegisterData,
    BindMobileData,
    UserInfo,
    LoginConfig,
    ThirdPartyBinding,
    QrCodeLoginInfo,
    WechatJssdkConfig,
} from './types'

/**
 * 用户登录认证
 */
export function authenticateUser(data: LoginData): Promise<LoginResponse> {
    return request.post('/auth/login', data)
}

/**
 * 手机验证码登录
 */
export function authenticateWithMobile(data: {
    mobile: string
    code: string
    key: string
}): Promise<LoginResponse> {
    return request.post('/auth/login/mobile', data)
}

/**
 * 用户退出登录
 */
export function logoutUser(): Promise<boolean> {
    return request.post('/auth/logout')
}

/**
 * 用户注册
 */
export function registerUser(data: RegisterData): Promise<LoginResponse> {
    const url = data.pid ? `/auth/register?pid=${data.pid}` : '/auth/register'
    return request.post(url, data)
}

/**
 * 手机号注册
 */
export function registerWithMobile(data: {
    mobile: string
    code: string
    key: string
    pid?: string
}): Promise<LoginResponse> {
    const url = data.pid ? `/auth/register/mobile?pid=${data.pid}` : '/auth/register/mobile'
    return request.post(url, data)
}

/**
 * 微信授权登录
 */
export function authenticateWithWechat(data: { code: string }): Promise<LoginResponse> {
    return request.post('/auth/wechat', data)
}

/**
 * 微信小程序登录
 */
export function authenticateWithWeapp(data: { code: string }): Promise<LoginResponse> {
    return request.post('/auth/weapp', data)
}

/**
 * 绑定手机号
 */
export function bindMobile(data: BindMobileData): Promise<LoginResponse> {
    const url = data.pid ? `/auth/bind?pid=${data.pid}` : '/auth/bind'
    return request.post(url, data)
}

/**
 * 生成微信扫码登录二维码
 */
export function generateWechatQrCode(): Promise<QrCodeLoginInfo> {
    return request.post('/auth/wechat/scan')
}

/**
 * 检查微信扫码状态
 */
export function checkWechatScanStatus(data: { scene_id: string }): Promise<{ status: string; token?: string }> {
    return request.get('/auth/wechat/scan/status', data)
}

/**
 * 检查微信登录可用性
 */
export function checkWechatAvailability(): Promise<boolean> {
    return request.get('/auth/wechat/availability')
}

/**
 * 获取第三方绑定列表
 */
export function getThirdPartyList(): Promise<ThirdPartyBinding[]> {
    return request.get('/auth/third-party/list')
}

/**
 * 绑定第三方账号
 */
export function bindThirdParty(data: { platform: number }): Promise<boolean> {
    return request.post('/auth/third-party/bind', data)
}

/**
 * 解绑第三方账号
 */
export function unbindThirdParty(platform: number): Promise<boolean> {
    return request.delete(`/auth/third-party/unbind/${platform}`)
}

/**
 * 生成第三方绑定二维码
 */
export function generateBindQrCode(platform: number): Promise<QrCodeLoginInfo> {
    return request.post('/auth/third-party/qr-code', { platform })
}

/**
 * 检查绑定二维码状态
 */
export function checkBindQrStatus(sceneId: string): Promise<{ status: string }> {
    return request.get('/auth/third-party/qr-status', { scene_id: sceneId })
}

/**
 * 验证邮箱（第一步：验证邮箱和验证码）
 */
export function verifyEmail(data: {
    email: string
    code: string
}): Promise<boolean> {
    return request.post('/auth/verify-email', data)
}

/**
 * 发送邮箱验证码
 */
export function sendEmailCode(data: {
    email: string
    captcha_key: string
    captcha_code: string
}): Promise<boolean> {
    return request.post('/auth/send-email-code', data)
}

/**
 * 忘记密码 - 重置密码（第二步：设置新密码）
 */
export function forgetPassword(data: {
    email: string
    code: string
    new_password: string
    confirm_password: string
}): Promise<boolean> {
    return request.post('/auth/forget-password', data)
}

/**
 * 刷新 Token
 */
export function refreshToken(refresh_token: string): Promise<{
    code: number
    msg: string
    data?: {
        access_token: string
        refresh_token: string
    }
}> {
    return request.post('/auth/refresh', { refresh_token }, {
        // 不带 token 请求，避免 401 循环
        headers: {},
    })
}

/**
 * 获取微信 JSSDK 配置
 */
export function getWechatJssdkConfig(url: string): Promise<WechatJssdkConfig> {
    return request.get('/wechat/jssdk-config', { url })
}
