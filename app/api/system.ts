/**
 * 获取验证码图片
 */
export function getCaptchaImage() {
    return request.get('/system/captcha', { time: Date.now() })
}

/**
 * 获取微信授权码
 */
export function getWechatAuthCode(data: AnyObject) {
    return request.get('/system/wechat/auth-code', data)
}

/**
 * 同步微信用户信息
 */
export function syncWechatUserInfo(data: AnyObject) {
    return request.get('/system/wechat/sync', data)
}

/**
 * 获取协议内容
 */
export function getAgreementContent(key: string) {
    return request.get(`/system/agreement/${key}`)
}

/**
 * 重置用户密码
 */
export function resetUserPassword(data: AnyObject) {
    return request.post('/system/password/reset', data)
}

/**
 * 发送短信验证码
 */
export function sendSmsVerificationCode(data: AnyObject) {
    return request.post(`/system/sms/${data.type}`, data)
}

/**
 * 获取微信 JSSDK 配置
 */
export function getWechatJssdkConfig(data: AnyObject) {
    return request.get('/system/wechat/jssdk-config', data)
}

/**
 * 获取远程图片
 */
export function fetchRemoteImage(data: AnyObject) {
    return request.post('/system/image/fetch', data)
}

/**
 * 获取 Base64 格式图片
 */
export function fetchBase64Image(data: AnyObject) {
    return request.post('/system/image/base64', data)
}

/**
 * 获取版权信息
 */
export function getCopyrightInfo() {
    return request.get('/system/copyright')
}

/**
 * 获取站点信息
 */
export function getSiteInformation() {
    return request.get('/system/site')
}

/**
 * 获取广告位信息
 */
export function getAdvertisementInfo(params: Record<string, any>) {
    return request.get('/system/web/advertisements', params, { showErrorMessage: false })
}

/**
 * 获取导航菜单列表
 */
export function getNavigationList() {
    return request.get('/system/web/navigation')
}

/**
 * 获取友情链接列表
 */
export function getFriendlyLinks() {
    return request.get('/system/web/friendly-links')
}