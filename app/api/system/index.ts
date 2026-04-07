import request from '~/utils/request'
import type { SiteConfig, AgreementType, SmsType } from './types'

/**
 * 按分组获取配置
 */
export function getConfigByGroup(groupCode: string, options?: {
    enabled_only?: boolean
    with_metadata?: boolean
}) {
    return request.get(`/system/config/group/${groupCode}`, options)
}

/**
 * 按 code 获取配置
 */
export function getConfigByCode(code: string, options?: { group_code?: string}) {
    return request.get(`/system/config/code/${code}`, options)
}


/**
 * 获取协议内容
 */
export function getAgreementContent(key: AgreementType): Promise<string> {
    return request.get(`/agreement/${key}`)
}

/**
 * 发送短信验证码
 */
export function sendSmsVerificationCode(data: {
    type: SmsType
    phone: string
    [key: string]: any
}): Promise<boolean> {
    return request.post(`/sms/${data.type}`, data)
}

/**
 * 获取验证码图片
 */
export function getCaptchaImage() {
    return request.get('/captcha', { time: Date.now() }, {
        showSuccessMessage: false,
        returnFullResponse: true
    })
}


/**
 * 获取远程图片
 */
export function fetchRemoteImage(data: { url: string }): Promise<string> {
    return request.post('/image/fetch', data)
}

/**
 * 获取 Base64 格式图片
 */
export function fetchBase64Image(data: { url: string }): Promise<string> {
    return request.post('/image/base64', data)
}

