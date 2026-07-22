/**
 * 会员模块相关类型定义
 */

/** 会员基本信息 */
export interface MemberInfo {
    id: number | string
    username: string
    nickname?: string
    avatar?: string
    phone?: string
    email?: string
    points: number
    balance: number
    level: number
    level_name?: string
    /** 权限码列表（由后端通过标签-权限关系注入） */
    permissions?: string[]
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
    type: number
    type_text?: string
    amount: number
    balance: number
    description: string
    created_at: string
}

/** 积分流水响应 */
export interface PointTransactionsResponse {
    data: PointTransaction[]
    total: number
    current_page: number
    per_page: number
}

/** 余额流水记录 */
export interface BalanceTransaction {
    id: number
    member_id: number
    type: number
    type_text?: string
    category_text?: string
    amount: number
    balance: number
    description: string
    created_at: string
}

/** 余额流水响应 */
export interface BalanceTransactionsResponse {
    data: BalanceTransaction[]
    total: number
    current_page: number
    per_page: number
}

/** 签到日历响应 */
export interface SignCalendar {
    year: number
    month: number
    calendar: string[]  // 已签到日期数组 ['2026-07-01', '2026-07-03', ...]
}

/** 签到统计 */
export interface SignStatistics {
    total_sign_days?: number
    month_sign_days?: number
    continuous_days?: number
    today_signed?: boolean
    sign_days?: number
    week_start?: string
    week_end?: string
    total_days?: number
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
    is_signed_today: boolean
    continuous_days: number
    total_sign_days: number
    month_sign_days: number
    today: string
    points: number
}

/** 签到结果 */
export interface SignResult {
    points: number
    continuous_days: number
    sign_date: string
}

/** 补签参数 */
export interface ReSignParams {
    sign_date: string
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
