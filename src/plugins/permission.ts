import type { App, Directive, Plugin } from 'vue'
import { useMemberStore } from '~/stores/member'

/**
 * 权限指令配置
 */
interface AuthDirectiveOptions {
  permissions: string | string[]
}

/**
 * 检查用户是否有权限
 * @param permissions 权限码或权限码数组
 * @returns 是否有权限
 */
export function hasAuth(permissions: string | string[]): boolean {
  const memberStore = useMemberStore()
  const userPermissions = memberStore.info?.permissions || []

  // 如果用户拥有所有权限，直接返回 true
  if (userPermissions.includes('*')) {
    return true
  }

  // 处理字符串权限
  if (typeof permissions === 'string') {
    return userPermissions.includes(permissions)
  }

  // 处理数组权限，只要拥有任一权限就返回 true
  return permissions.some(permission => userPermissions.includes(permission))
}

/**
 * 权限指令
 */
const authDirective: Directive = {
  mounted(el: HTMLElement, binding: any) {
    const hasPermission = hasAuth(binding.value)
    if (!hasPermission) {
      el.style.display = 'none'
    }
  },
  updated(el: HTMLElement, binding: any) {
    const hasPermission = hasAuth(binding.value)
    if (!hasPermission) {
      el.style.display = 'none'
    } else {
      el.style.display = ''
    }
  }
}

/**
 * 权限插件
 */
const permissionPlugin: Plugin = {
  install(app: App) {
    // 注册 v-auth 指令
    app.directive('auth', authDirective)

    // 注册全局 hasAuth 函数
    app.config.globalProperties.$hasAuth = hasAuth

    // 提供给组合式 API 使用
    app.provide('hasAuth', hasAuth)
  }
}

export default permissionPlugin
