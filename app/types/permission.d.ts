import type { ComponentCustomProperties } from 'vue'

/**
 * 扩展 Vue 实例类型，添加权限相关方法
 */
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    /**
     * 检查用户是否有权限
     * @param permissions 权限码或权限码数组
     * @returns 是否有权限
     */
    $hasAuth: (permissions: string | string[]) => boolean
  }
}

/**
 * 权限指令类型
 */
declare module 'vue' {
  interface GlobalDirectives {
    auth: typeof import('~/plugins/permission').authDirective
  }
}

/**
 * 导出权限相关类型
 */
export {}