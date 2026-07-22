import { defineNuxtRouteMiddleware, useMemberStore, useSystemStore, showError, createError } from '#imports'

/**
 * 权限中间件
 *
 * 检查逻辑：
 *   1. is_public === true（或未定义，默认公开） → 直接通过
 *   2. backend/hybrid 模式：非公开路由须在后端菜单中有关联 code
 *      - code 不存在于后端菜单 code 集合 → 404
 *   3. is_public !== true（false / 0 / '0' 等） → 必须登录
 *      - 未登录 → 打开登录弹窗，阻止导航
 *   4. 已登录 → 检查权限码（code / permission / permissions）
 *      - 无权限码 → 已登录即可访问
 *      - 有权限码 → 校验用户是否持有对应权限
 *        - 无权限 → 404
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const memberStore = useMemberStore()
  const systemStore = useSystemStore()
  const meta = to.meta as Record<string, any>

  // ── 1. 公开路由判断 ──
  // is_public 默认 true，只有显式设为 false / 0 / '0' 才为非公开
  const isPublic = meta.is_public !== false
    && meta.is_public !== 0
    && meta.is_public !== '0'

  if (isPublic) {
    // 公开路由，直接通过
    return
  }

  // ── 2. 后端/混合模式：非公开路由须在后端菜单中有关联 code ──
  // 非公开路由若未在后端菜单注册（code 不在后端下发的 code 集合中），
  // 即使前端注册了该路由，也应返回 404（不存在的页面）
  // 例外：code 未定义或显式为 '' → 只需登录即可访问，跳过后端校验
  if (systemStore.routingMode !== 'frontend' && systemStore.isInitialized) {
    const routeCode = meta.code as string | undefined
    if (routeCode !== undefined && routeCode !== '') {
      if (!systemStore.isValidBackendMenuCode(routeCode)) {
        showError(createError({ statusCode: 404, statusMessage: 'Page Not Found' }))
        return
      }
    }
  }

  // ── 3. 非公开路由：必须登录 ──
  if (!memberStore.info) {
    // SSR 环境下无法弹登录框，放行让客户端接管
    if (import.meta.server) {
      return
    }
    memberStore.logOpen()
    return false
  }

  // ── 3.5 is_no_auth=true → 已登录即可，跳过权限码校验 ──
  const isNoAuth = meta.is_no_auth === true
    || meta.is_no_auth === 1
    || meta.is_no_auth === '1'
  if (isNoAuth) {
    return
  }

  // ── 4. 已登录 → 检查权限码 ──
  // 优先取 code，其次取 permission / permissions
  const rawCode = meta.code
  const rawPermission = meta.permission || meta.permissions
  const routePermissions: string[] = []

  // code 作为权限码
  if (rawCode) {
    if (typeof rawCode === 'string') {
      routePermissions.push(...rawCode.split(',').map((p: string) => p.trim()).filter(Boolean))
    } else if (Array.isArray(rawCode)) {
      routePermissions.push(...rawCode)
    }
  }

  // permission / permissions 也作为权限码（补充）
  if (rawPermission) {
    if (Array.isArray(rawPermission)) {
      routePermissions.push(...rawPermission)
    } else {
      routePermissions.push(...String(rawPermission).split(',').map((p: string) => p.trim()).filter(Boolean))
    }
  }

  // 去重
  const uniquePermissions = [...new Set(routePermissions)]

  // 无权限码 → 已登录即可访问（非公开但无特定权限要求）
  if (uniquePermissions.length === 0) {
    return
  }

  // 有权限码 → 校验用户权限
  const hasPermission = systemStore.checkMenuPermission({
    id: 0,
    meta: {
      permissions: uniquePermissions,
    },
  } as any)

  if (!hasPermission) {
    // 无权限 → 404（前端/后端/混合模式均适用）
    showError(createError({ statusCode: 404, statusMessage: 'Page Not Found' }))
    return
  }
})
