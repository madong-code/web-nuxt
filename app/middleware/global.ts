// 导入权限中间件
import authMiddleware from './auth'

/**
 * 全局中间件
 * 应用于所有路由
 */
export default defineNuxtRouteMiddleware((to, from) => {
  // 运行权限中间件
  return authMiddleware(to, from)
})