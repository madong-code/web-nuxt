/**
 * 会员模块相关类型定义
 */

/** 会员基本信息 */
export interface MemberInfo {
    id: number
    username: string
    nickname?: string
    avatar?: string
    phone?: string
    email?: string
    points: number
    balance: number
    level: number
    level_name?: string
    created_at: number
    updated_at: number
}

/** 地址 */
export interface Address {
    id: number
    user_id: number
    consignee: string
    phone: string
    province: string
    city: string
    district: string
    address: string
    postal_code?: string
    is_default: number
    created_at: number
    updated_at: number
}

/** 积分流水记录 */
export interface PointTransaction {
    id: number
    user_id: number
    type: string
    amount: number
    balance: number
    description: string
    created_at: number
}

/** 积分流水响应 */
export interface PointTransactionsResponse {
    total: number
    list: PointTransaction[]
}

/** 余额流水记录 */
export interface BalanceTransaction {
    id: number
    user_id: number
    type: string
    amount: number
    balance: number
    description: string
    created_at: number
}

/** 余额流水响应 */
export interface BalanceTransactionsResponse {
    total: number
    list: BalanceTransaction[]
}

/** 签到日历 */
export interface SignCalendar {
    year: number
    month: number
    signed_dates: number[]
    total_signed: number
    total_can_sign: number
}

/** 签到统计 */
export interface SignStatistics {
    total_signed: number
    continuous_signed: number
    this_month_signed: number
    today_signed: boolean
}

/** 会员等级信息 */
export interface MemberLevel {
    level: number
    level_name: string
    points: number
    next_level_points?: number
}

/** 签到状态 */
export interface SignStatus {
    today_signed: boolean
    continuous_days: number
    can_sign: boolean
}

/** 发送验证码参数 */
export interface SendCodeParams {
    type: string
    mobile: string
}

/** 绑定手机参数 */
export interface BindPhoneParams {
    phone: string
    verify_code: string
}

/** 更新邮箱参数 */
export interface UpdateEmailParams {
    email: string
    verify_code: string
}
