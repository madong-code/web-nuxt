import { hasAuth } from '~/plugins/permission'

/**
 * 权限检查组合式函数
 */
export function useAuth() {
  return {
    /**
     * 检查用户是否有权限
     * @param permissions 权限码或权限码数组
     * @returns 是否有权限
     */
    hasAuth,

    /**
     * 检查用户是否没有权限
     * @param permissions 权限码或权限码数组
     * @returns 是否没有权限
     */
    lacksAuth: (permissions: string | string[]) => !hasAuth(permissions)
  }
}
