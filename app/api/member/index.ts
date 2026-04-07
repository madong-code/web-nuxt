import request from '~/utils/request'
import type {
    MemberInfo,
    Address,
    PointTransactionsResponse,
    BalanceTransactionsResponse,
    SignCalendar,
    SignStatistics,
    MemberLevel,
    SignStatus
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
    page_size?: number
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
    page_size?: number
}): Promise<BalanceTransactionsResponse> {
    return request.get('/member/balance/record', data)
}

/**
 * 获取所有余额流水记录
 */
export function getAllBalanceTransactions(data?: {
    page?: number
    page_size?: number
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
 * 会员签到
 */
export function memberSign(): Promise<number> {
    return request.post('/member/points/sign')
}

/**
 * 执行签到
 */
export function signIn(): Promise<boolean> {
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
 * 获取验证码
 */
export function getVerificationCode(data: { type: string; phone: string }): Promise<boolean> {
    return request.post('/member/user/send-code', data)
}

/**
 * 修改手机号码
 */
export function updateMemberMobile(data: {
    oldMobile: string
    newMobile: string
    code: string
}): Promise<boolean> {
    return request.put('/member/user/update-phone', {
        old_phone: data.oldMobile,
        new_phone: data.newMobile,
        verify_code: data.code
    })
}

/**
 * 修改邮箱
 */
export function updateMemberEmail(data: { email: string; code: string }): Promise<boolean> {
    return request.put('/member/user/update-email', {
        email: data.email,
        verify_code: data.code
    })
}

/**
 * 上传头像
 */
export function uploadAvatar(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/member/user/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        } as any
    })
}

