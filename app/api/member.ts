/**
 * 获取会员基本信息
 */
export function getMemberProfile() {
    return request.get('/member/profile')
}

/**
 * 更新会员信息
 */
export function updateMemberInfo(data: AnyObject) {
    return request.put(`/member/profile/${data.field}`, data)
}

/**
 * 获取积分流水记录
 */
export function getPointTransactions(data: AnyObject) {
    return request.get('/member/points/transactions', data)
}

/**
 * 获取会员积分总额
 */
export function getMemberPointsTotal() {
    return request.get('/member/points/total')
}

/**
 * 获取余额流水记录
 */
export function getBalanceTransactions(data: AnyObject) {
    return request.get('/member/balance/transactions', data)
}

/**
 * 获取所有余额流水记录
 */
export function getAllBalanceTransactions(data: AnyObject) {
    return request.get('/member/balance/transactions/all', data)
}

/**
 * 绑定会员手机号
 */
export function bindMemberMobile(data: AnyObject) {
    return request.put('/member/mobile', data)
}

/**
 * 获取会员等级信息
 */
export function getMemberLevel() {
    return request.get('/member/level')
}