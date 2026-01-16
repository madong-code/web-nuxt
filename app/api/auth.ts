
/**
 * 用户登录认证
 */
export function authenticateUser(data: AnyObject) {
    return request.post('/auth/login', data)
}

/**
 * 手机验证码登录
 */
export function authenticateWithMobile(data: AnyObject) {
    return request.post('/auth/login/mobile', data)
}

/**
 * 获取登录配置信息
 */
export function getLoginConfig() {
    return request.get('/auth/config')
}

/**
 * 用户退出登录
 */
export function logoutUser() {
    return request.post('/auth/logout')
}

/**
 * 用户注册
 */
export function registerUser(data: AnyObject) {
    const url = data.pid ? `/auth/register?pid=${data.pid}` : '/auth/register'
    return request.post(url, data)
}

/**
 * 手机号注册
 */
export function registerWithMobile(data: AnyObject) {
    const url = data.pid ? `/auth/register/mobile?pid=${data.pid}` : '/auth/register/mobile'
    return request.post(url, data)
}

/**
 * 微信授权登录
 */
export function authenticateWithWechat(data: AnyObject) {
    return request.post('/auth/wechat', data)
}

/**
 * 微信小程序登录
 */
export function authenticateWithWeapp(data: AnyObject) {
    return request.post('/auth/weapp', data)
}

/**
 * 绑定手机号
 */
export function bindMobile(data: AnyObject) {
    const url = data.pid ? `/auth/bind?pid=${data.pid}` : '/auth/bind'
    return request.post(url, data)
}

/**
 * 生成微信扫码登录二维码
 */
export function generateWechatQrCode() {
    return request.post('/auth/wechat/scan')
}

/**
 * 检查微信扫码状态
 */
export function checkWechatScanStatus(data: AnyObject) {
    return request.get('/auth/wechat/scan/status', data)
}

/**
 * 检查微信登录可用性
 */
export function checkWechatAvailability() {
    return request.get('/auth/wechat/availability')
}