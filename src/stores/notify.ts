import { defineStore } from 'pinia'
import { nextTick } from 'vue'
import { useSystemStore } from '~/stores/system'

/**
 * 通用通知 store（可插拔）
 *
 * 设计目标：
 *  - 核心层不依赖任何插件，无插件时也能正常运行（空 provider 静默）。
 *  - 任何插件 / 外部模块可通过 registerNotifyProvider() 接入未读数，驱动
 *    「消息铃铛」等头部动作徽章，以及可操控菜单（extra.controllable）的 DOM 徽章。
 *  - 移除插件时只需 unregisterNotifyProvider()，核心自动跳过，不影响其余功能。
 *
 * Provider 接口：
 *  - key        : badge key（通常是头部动作的 path，如 '/notify'），用于 setHeaderActionBadge
 *  - fetchUnread: 拉取未读数（返回数字），由核心按节奏调用并写入徽章
 *  - cleanup?   : 可选清理回调（如取消订阅）
 */

export interface NotifyProvider {
  /** 徽章 key（头部动作 path 或 id） */
  key: string
  /** 拉取未读数 */
  fetchUnread: () => Promise<number> | number
  /** 可选清理回调（登出 / 卸载时调用） */
  cleanup?: () => void
}

/** 模块级注册表：存放 provider（函数等不可序列化内容不进 pinia state，与 headerActionOverrides 同理） */
const providers = new Map<string, NotifyProvider>()

export const useNotifyStore = defineStore('notify', {
  state: () => ({
    /** 当前未读数（聚合所有 provider 后取最大，用于展示） */
    unreadCount: 0,
    /** 自动刷新定时器 */
    refreshInterval: null as ReturnType<typeof setInterval> | null,
    /** 是否已初始化（幂等） */
    isInitialized: false,
    /** 是否处于调试模式（虚拟数据） */
    isDebug: false,
  }),

  getters: {
    /** 是否有未读消息 */
    hasUnread(): boolean {
      return this.unreadCount > 0
    },

    /** 已注册的 provider 数量（用于调试 / 判断是否有通知源） */
    providerCount(): number {
      return providers.size
    },
  },

  actions: {
    /**
     * 注册一个通知 provider（由插件 / 外部模块调用）。
     * 相同 key 会覆盖，便于热更新。
     */
    registerProvider(provider: NotifyProvider): void {
      providers.set(provider.key, provider)
    },

    /**
     * 移除一个通知 provider（插件卸载时调用）。
     * 移除后核心照常运行，只是不再为该项拉取徽章。
     */
    unregisterProvider(key: string): void {
      providers.delete(key)
    },

    /** 返回已注册的 provider 列表（模块级，非响应式） */
    getProviders(): NotifyProvider[] {
      return Array.from(providers.values())
    },

    /**
     * 获取可操控菜单（extra.controllable = true）的 DOM 元素。
     * 通用能力：任何插件都可以把菜单标记为可操控以展示徽章。
     */
    getControllableMenuElement(): HTMLElement | null {
      const el = document.querySelector('[data-menu-controllable="true"]')
      if (el) return el as HTMLElement
      return document.querySelector('.el-menu-item.menu-controllable') as HTMLElement | null
    },

    /**
     * 更新菜单 DOM 徽章（通用能力，作用于可操控菜单）。
     */
    updateBadgeDOM(count: number): void {
      const menuEl = this.getControllableMenuElement()
      if (!menuEl) return

      let badgeEl = menuEl.querySelector('.menu-badge') as HTMLElement | null

      if (count > 0) {
        if (!badgeEl) {
          badgeEl = document.createElement('span')
          badgeEl.className = 'menu-badge badge-danger'
          badgeEl.setAttribute('data-badge', String(count))

          const titleEl = menuEl.querySelector('.menu-title, .el-menu-item__title')
          if (titleEl && titleEl.parentNode) {
            titleEl.parentNode.insertBefore(badgeEl, titleEl.nextSibling)
          } else {
            menuEl.appendChild(badgeEl)
          }
        }

        badgeEl.textContent = count > 99 ? '99+' : String(count)
        badgeEl.setAttribute('data-badge', String(count))
        badgeEl.style.display = 'inline-flex'

        menuEl.classList.add('has-badge', 'menu-notify-active')
      } else {
        if (badgeEl) {
          badgeEl.style.display = 'none'
        }
        menuEl.classList.remove('has-badge', 'menu-notify-active')
      }
    },

    /**
     * 检查是否启用调试模式（仅开发环境，通过 localStorage 启用虚拟数据）。
     */
    checkDebugMode(): void {
      if (import.meta.env.DEV && import.meta.client) {
        this.isDebug = localStorage.getItem('notifyDebug') === 'true'
      }
    },

    /** 生成虚拟未读数（调试用） */
    getMockUnreadCount(): number {
      return Math.floor(Math.random() * 99) + 1
    },

    /**
     * 拉取所有 provider 的未读数并更新徽章。
     * @param useMock 是否强制使用虚拟数据（调试）
     */
    async fetchUnread(useMock: boolean = false): Promise<number> {
      this.checkDebugMode()
      const shouldUseMock = useMock || this.isDebug

      // 空 provider：核心仍可运行，只是没有任何通知源
      const list = this.getProviders()
      if (list.length === 0) {
        this.unreadCount = 0
        this.applyBadges(0)
        return 0
      }

      let maxCount = 0
      await Promise.all(
        list.map(async (provider) => {
          try {
            let count = shouldUseMock
              ? this.getMockUnreadCount()
              : await provider.fetchUnread()

            count = Number(count) || 0
            if (count > maxCount) maxCount = count
            // 每个 provider 各自设置自己的 badge key
            const systemStore = useSystemStore()
            systemStore.setHeaderActionBadge(provider.key, count)
          } catch (err) {
            // 单个 provider 失败不影响其它 provider
            const systemStore = useSystemStore()
            systemStore.setHeaderActionBadge(provider.key, 0)
          }
        })
      )

      this.unreadCount = maxCount
      // 更新可操控菜单的 DOM 徽章（headerAction 徽章已由各 provider 分别写入）
      this.applyBadges(maxCount)
      return maxCount
    },

    /** 应用聚合徽章（仅更新可操控菜单的 DOM 徽章） */
    applyBadges(count: number): void {
      nextTick(() => {
        this.updateBadgeDOM(count)
      })
    },

    /** 处理菜单挂载事件：菜单渲染后立即更新已有徽章 */
    handleMenuMounted: (): void => {
      const store = useNotifyStore()
      store.updateBadgeDOM(store.unreadCount)
    },

    /**
     * 初始化（登录态 + 站点菜单就绪后由 notify.client.ts 调用）。
     * 幂等；无 provider 时仍注册事件监听，但不报错。
     */
    init(): void {
      if (!import.meta.client) return
      if (this.isInitialized) return
      this.isInitialized = true

      window.addEventListener('menu:controllable:mounted', this.handleMenuMounted)

      void this.fetchUnread()

      this.startAutoRefresh()
    },

    /** 清理（登出 / 卸载时调用） */
    cleanup(): void {
      if (!import.meta.client) return
      this.stopAutoRefresh()
      window.removeEventListener('menu:controllable:mounted', this.handleMenuMounted)
      this.updateBadgeDOM(0)

      // 清空所有已注册 provider 的 badge
      const systemStore = useSystemStore()
      for (const provider of this.getProviders()) {
        systemStore.setHeaderActionBadge(provider.key, 0)
        if (typeof provider.cleanup === 'function') {
          try {
            provider.cleanup()
          } catch (err) {
            // 忽略单个 provider 清理异常
          }
        }
      }

      this.isInitialized = false
      this.$reset()
    },

    /** 开始自动刷新 */
    startAutoRefresh(intervalMs: number = 30000): void {
      this.stopAutoRefresh()
      this.refreshInterval = setInterval(() => {
        void this.fetchUnread()
      }, intervalMs)
    },

    /** 停止自动刷新 */
    stopAutoRefresh(): void {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
    },
  },
})

/**
 * 独立注册函数（供插件模块顶层 / 任意时机调用，不依赖 pinia 是否已 ready）。
 * 直接操作模块级注册表，因此没有 store 实例也能注册。
 */
export function registerNotifyProvider(provider: NotifyProvider): void {
  providers.set(provider.key, provider)
}

export function unregisterNotifyProvider(key: string): void {
  providers.delete(key)
}
