/**
 * 会员模块 API
 *
 * 对应后端：member/MemberController, member/MemberPointsController, member/MemberSignController
 */
import request from '~/api/request'
import type {
    MemberInfo,
    Address,
    PointTransactionsResponse,
    BalanceTransactionsResponse,
    SignCalendar,
    SignStatistics,
    MemberLevel,
    SignStatus,
    SignResult,
    ReSignParams,
    BindPhoneParams,
    UpdateEmailParams,
} from './types'

/**
 * 获取会员基本信息
 */
export function getMemberProfile(): Promise<MemberInfo> {
    return request.get('/member/user-info')
}

/**
 * 更新会员信息
 */
export function updateMemberInfo(data: Partial<MemberInfo>): Promise<boolean> {
    return request.put('/member/user/update', data)
}

/**
 * 获取积分流水记录
 */
export function getPointTransactions(data: {
    page?: number
    limit?: number
}): Promise<PointTransactionsResponse> {
    return request.get('/member/points/record', data)
}

/**
 * 获取会员积分总额
 */
export function getMemberPointsTotal(): Promise<number> {
    return request.get('/member/points/total')
}

/**
 * 获取余额流水记录
 */
export function getBalanceTransactions(data: {
    page?: number
    limit?: number
}): Promise<BalanceTransactionsResponse> {
    return request.get('/member/balance/record', data)
}

/**
 * 获取所有余额流水记录
 */
export function getAllBalanceTransactions(data?: {
    page?: number
    limit?: number
}): Promise<BalanceTransactionsResponse> {
    return request.get('/member/balance/all', data)
}

/**
 * 获取会员等级信息
 */
export function getMemberLevel(): Promise<MemberLevel> {
    return request.get('/member/points/level')
}

/**
 * 会员签到（积分模块）
 */
export function memberSign(): Promise<number> {
    return request.post('/member/points/sign')
}

/**
 * 执行签到（签到模块）
 */
export function signIn(): Promise<SignResult> {
    return request.post('/member/sign')
}

/**
 * 获取签到状态
 */
export function getSignStatus(): Promise<SignStatus> {
    return request.get('/member/sign/status')
}

/**
 * 获取签到日历
 */
export function getSignCalendar(year: number, month: number): Promise<SignCalendar> {
    return request.get('/member/sign/calendar', { year, month })
}

/**
 * 获取签到统计
 */
export function getSignStatistics(type: string = 'month'): Promise<SignStatistics> {
    return request.get('/member/sign/statistics', { type })
}

/**
 * 补签
 */
export function reSign(data: ReSignParams): Promise<SignResult> {
    return request.post('/member/sign/resign', data)
}

/**
 * 修改密码
 */
export function changePassword(data: {
    old_password: string
    new_password: string
    confirm_password: string
}): Promise<boolean> {
    return request.put('/member/user/change-password', data)
}

/**
 * 获取地址列表
 */
export function getAddressList(): Promise<Address[]> {
    return request.get('/member/user/address/list')
}

/**
 * 创建地址
 */
export function createAddress(data: Partial<Address>): Promise<Address> {
    return request.post('/member/user/address/create', data)
}

/**
 * 更新地址
 */
export function updateAddress(id: number, data: Partial<Address>): Promise<boolean> {
    return request.put(`/member/user/address/update/${id}`, data)
}

/**
 * 删除地址
 */
export function deleteAddress(id: number): Promise<boolean> {
    return request.delete(`/member/user/address/delete/${id}`)
}

/**
 * 发送短信验证码（对齐后端 /sms/{type} 路径）
 *
 * 后端接收参数：{ mobile, type }，type 为 'change_phone' 等
 */
export function sendVerificationCode(data: { type: string; mobile: string }): Promise<boolean> {
    return request.post(`/sms/${data.type}`, data)
}

/**
 * 修改手机号码
 *
 * 后端路径 /member/user/bind-phone，接收参数 { phone, verify_code }
 */
export function updateMemberMobile(data: {
    oldMobile: string
    newMobile: string
    code: string
}): Promise<boolean> {
    return request.put('/member/user/bind-phone', {
        phone: data.newMobile,
        verify_code: data.code,
    })
}

/**
 * 修改邮箱
 *
 * 后端路径 /member/user/update-email，接收参数 { email, verify_code }
 */
export function updateMemberEmail(data: UpdateEmailParams): Promise<boolean> {
    return request.put('/member/user/update-email', data)
}

/**
 * 上传头像结果
 */
export interface AvatarUploadResult {
    url: string
    filename: string
}

/**
 * 上传头像（multipart/form-data，走 request.upload 原样透传 FormData）
 */
export function uploadAvatar(file: File): Promise<AvatarUploadResult> {
    const formData = new FormData()
    formData.append('file', file)
    return request.upload('/member/user/avatar', formData)
}
