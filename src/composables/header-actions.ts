/**
 * useHeaderActions —— 头部动作菜单（category='3'）的统一访问入口。
 *
 * 职责：
 *  1. 对外暴露注册/更新/移除/徽章 API，供插件、页面自定义导航栏右侧入口
 *     （如消息铃铛、待办、客服），无需直接耦合 systemStore 内部覆写表。
 *  2. 集中封装「取键 / 徽章 / 点击跳转」等渲染期逻辑，避免
 *     header-actions-extra.vue 与 mobile-drawer.vue 各自重复实现、易失同步。
 *
 * 设计要点：
 *  - onClick 回调存储在模块级覆写表（含函数、不进持久化），重 init 不丢失。
 *  - 匹配键统一为 path 优先、其次 id（与 store.registerHeaderAction 一致），
 *    解决组件层 actionKey 与 store resolveHeaderActionKey 不一致的问题。
 *  - 可见性由 systemStore.headerActions getter + checkMenuPermission 处理，
 *    本 composable 只负责把「最终列表」与渲染辅助函数提供给组件。
 */
import { computed } from 'vue'
import { navigateTo } from 'nuxt/app'
import type { Menus, HeaderActionConfig } from '~/stores/interface'
import { useSystemStore } from '~/stores/system'

export function useHeaderActions() {
  const systemStore = useSystemStore()

  /** 最终渲染的头部动作项（已按登录/权限过滤） */
  const actions = computed<Menus[]>(() =>
    systemStore.headerActions.filter((m) => systemStore.checkMenuPermission(m)),
  )

  /** 取项的匹配键：path 优先，其次 id（与 store 注册键一致） */
  const actionKey = (action: Menus): string => action.path || action.id || ''

  /** 徽章计数（数字化，<=0 表示不显示） */
  const badgeCount = (action: Menus): number => {
    const raw = action.meta?.badge
    const n = typeof raw === 'number' ? raw : Number(raw || 0)
    return Number.isFinite(n) ? n : 0
  }

  /**
   * 点击头部动作项：
   *  - 若外部注册了自定义 onClick 回调，优先执行（如展开消息面板）
   *  - 否则按路由 path 跳转，或外链 url（支持 _blank 新窗口）
   * @param action 菜单项；onBeforeNavigate 可选回调（如移动端先关闭抽屉）
   */
  const handleClick = (action: Menus, onBeforeNavigate?: () => void) => {
    const key = actionKey(action)
    const customHandler = systemStore.getHeaderActionClickHandler(key)
    if (customHandler) {
      customHandler()
      return
    }

    const target = (action.meta?.target as string) || '_self'

    // 外链
    if (action.type === 'link' && action.url) {
      if (target === '_blank') window.open(action.url, '_blank')
      else window.location.href = action.url
      return
    }

    // 内部路由
    if (action.path) {
      if (onBeforeNavigate) onBeforeNavigate()
      if (target === '_blank') {
        window.open(action.path, '_blank')
      } else {
        navigateTo(action.path)
      }
    }
  }

  /** 注册 / 全量重写一个头部动作项（path 或 id 必填其一） */
  const register = (config: HeaderActionConfig): string =>
    systemStore.registerHeaderAction(config)

  /** 局部更新已注册的头部动作项（不存在则按 key 新建） */
  const update = (key: string, patch: Partial<HeaderActionConfig> & { visible?: boolean }) =>
    systemStore.updateHeaderAction(key, patch)

  /** 仅更新徽章计数（最常用：消息未读数） */
  const setBadge = (key: string, count: string | number) =>
    systemStore.setHeaderActionBadge(key, count)

  /** 设置可见性（如登录后显示、登出后隐藏） */
  const setVisible = (key: string, visible: boolean) =>
    systemStore.setHeaderActionVisible(key, visible)

  /** 移除一个头部动作项 */
  const remove = (key: string) => systemStore.removeHeaderAction(key)

  return {
    actions,
    actionKey,
    badgeCount,
    handleClick,
    register,
    update,
    setBadge,
    setVisible,
    remove,
  }
}
