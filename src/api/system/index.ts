/**
 * 系统模块 API
 *
 * 对应后端：system/ConfigController, system/CaptchaController, system/AgreementController, upload/UploadController
 */
import request from '~/api/request'
import type {
    SiteConfig,
    AgreementType,
    SmsType,
    CaptchaImageResponse,
    AgreementContent,
    ConfigGroupResponse,
} from './types'

/**
 * 按分组获取配置
 */
export function getConfigByGroup(groupCode: string, options?: {
    enabled_only?: boolean
    with_metadata?: boolean
}): Promise<ConfigGroupResponse> {
    return request.get(`/system/config/group/${groupCode}`, options)
}

/**
 * 按 code 获取配置
 */
export function getConfigByCode(code: string, options?: { group_code?: string }): Promise<SiteConfig> {
    return request.get(`/system/config/code/${code}`, options)
}

/**
 * 获取协议内容
 */
export function getAgreementContent(key: AgreementType): Promise<AgreementContent> {
    return request.get(`/agreement/${key}`)
}

/**
 * 发送短信验证码
 *
 * 后端路径 /sms/{type}，由 CaptchaController::sendSmsCode 处理
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
export function getCaptchaImage(): Promise<CaptchaImageResponse> {
    return request.get('/captcha', { time: Date.now() }, {
        showSuccessMessage: false,
        returnFullResponse: true,
    })
}


