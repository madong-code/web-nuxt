import { defineNuxtRouteMiddleware, useMemberStore, useSystemStore, navigateTo } from '#imports'

/**
 * 权限中间件
 * 检查路由是否需要权限，如果需要则验证用户权限
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const memberStore = useMemberStore()
  const systemStore = useSystemStore()
  
  // 获取路由的权限配置
  const routePermissions = to.meta.permissions
  
  // 如果路由没有配置权限，直接通过
  if (!routePermissions) {
    return
  }
  
  // 检查用户是否登录
  if (!memberStore.info) {
    // 如果用户未登录，打开登录弹窗
    memberStore.logOpen()
    return false
  }
  
  // 检查用户是否有权限访问
  const hasPermission = systemStore.checkMenuPermission({
    id: 0,
    meta: {
      permissions: routePermissions
    }
  } as any)
  
  if (!hasPermission) {
    // 如果用户没有权限，跳转到个人资料页面
    return navigateTo('/member/profile', {
      replace: true
    })
  }
})