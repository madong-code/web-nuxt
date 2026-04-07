// 会员相关类型定义

// 会员信息类型
export interface MemberInfo {
  id: number
  username: string
  nickname: string
  phone: string
  email: string
  avatar: string
  level_id: number
  level_name: string
  points: number
  balance: number
  create_time: number
}

// 会员登录请求类型
export interface LoginRequest {
  username: string
  password: string
  remember?: boolean
}

// 会员注册请求类型
export interface RegisterRequest {
  username: string
  password: string
  nickname: string
  phone: string
  email?: string
  verify_code: string
}

// 会员签到响应类型
export interface SignResponse {
  points: number
  continue_days: number
  total_points: number
}

// 积分记录类型
export interface PointsRecord {
  id: number
  points: number
  balance: number
  type: number
  type_text: string
  remark: string
  create_time: number
}

// 积分记录列表响应类型
export interface PointsRecordResponse {
  total: number
  list: PointsRecord[]
}

// 积分规则类型
export interface PointsRule {
  title: string
  points: number
  remark: string
}

// 积分规则响应类型
export interface PointsRulesResponse {
  sign_points: number
  login_points: number
  max_sign_days: number
  rules: PointsRule[]
}

// 积分等级类型
export interface PointsLevel {
  id: number
  name: string
  min_points: number
  max_points: number
  icon: string
  description: string
}

// 地址类型
export interface Address {
  id: number
  name: string
  phone: string
  province: string
  city: string
  district: string
  address: string
  is_default: number
}

// 更新会员信息请求类型
export interface UpdateMemberRequest {
  nickname?: string
  avatar?: string
  email?: string
}

// 修改密码请求类型
export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

// 绑定手机号请求类型
export interface BindPhoneRequest {
  phone: string
  verify_code: string
}

// 创建地址请求类型
export interface CreateAddressRequest {
  name: string
  phone: string
  province: string
  city: string
  district: string
  address: string
  is_default?: number
}

// 通用响应类型
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}
