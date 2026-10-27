import { defineStore } from 'pinia'
import { nextTick } from 'vue'
import { useSystemStore } from '~/stores/system'

/**
 * 通用通知 store（可插拔，未读徽章唯一数据源 / store 模式）
 *
 * 设计目标：
 *  - 核心层不依赖任何插件，无插件时也能正常运行（空 provider 静默）。
 *  - 徽章未读状态统一由本 store 持有：头部头像总徽章、会员菜单徽章、
 *    移动端抽屉、通知面板等消费端一律从 store 读取，不再各自拉取各自维护。
 *  - 插件两种接入方式（消费端与框架零改动，直接驱动即全端联动）：
 *    1. 被动轮询：registerNotifyProvider({ key, fetchUnread, mode })，
 *       核心按节奏（init + 30s 轮询）调用 fetchUnread 并写入徽章；
 *    2. 主动驱动：任意时机调用 setCount / incr / decr / clear / fetchCount，
 *       无需注册 provider，头像总未读、菜单徽章、头部动作徽章实时联动。
 *
 * Provider 接口：
 *  - key        : 徽章 key（推荐与会员菜单 url 一致，如 '/notify'、'/messages'，
 *                 菜单徽章按 URL 自动挂载）；主动驱动时也用作 setCount 的键
 *  - fetchUnread: 拉取未读数（返回数字），由核心按节奏调用并写入徽章
 *  - cleanup?   : 可选清理回调（如取消订阅）
 */

export interface NotifyProvider {
  /** 徽章 key（头部动作 path 或 id；推荐与会员菜单 url 一致以便徽章自动挂载） */
  key: string
  /** 拉取未读数 */
  fetchUnread: () => Promise<number> | number
  /**
   * 展示模式（对接接口，默认 'count'）：
   *  - 'count'：数字徽章（99+ 封顶），并计入头像未读总数
   *  - 'dot'  ：红点提示（有未读即亮红点，不显示数字），不计入头像总数
   */
  mode?: 'count' | 'dot'
  /** 可选清理回调（登出 / 卸载时调用） */
  cleanup?: () => void
}

/** 模块级注册表：存放 provider（函数等不可序列化内容不进 pinia state，与 headerActionOverrides 同理） */
const providers = new Map<string, NotifyProvider>()

export const useNotifyStore = defineStore('notify', {
  state: () => ({
    /** 各 key 最新未读数（徽章 key → 数量），所有徽章/总未读的唯一数据源 */
    providerCounts: {} as Record<string, number>,
    /** 各 key 展示模式（'count' 数字 / 'dot' 红点），注册/fetch 时同步；未知 key 默认 count */
    providerModes: {} as Record<string, 'count' | 'dot'>,
    /** 自动刷新定时器 */
    refreshInterval: null as ReturnType<typeof setInterval> | null,
    /** 是否已初始化（幂等） */
    isInitialized: false,
    /** 是否处于调试模式（虚拟数据） */
    isDebug: false,
  }),

  getters: {
    /**
     * 头像总未读 = 全部 count 模式 key 的未读之和（dot 模式不计入数字）。
     * 聚合逻辑内聚在 store：任何 key（含无 provider、仅 setCount 主动驱动的）
     * 都会计入，插件零注册也能驱动头像徽章。
     */
    totalUnread(): number {
      return Object.entries(this.providerCounts).reduce(
        (sum, [key, n]) => ((this.providerModes[key] ?? 'count') === 'count' ? sum + (Number(n) || 0) : sum),
        0,
      )
    },

    /** 是否存在 dot 模式未读（头像右下角呼吸点条件之一） */
    hasDotUnread(): boolean {
      return Object.entries(this.providerCounts).some(
        ([key, n]) => (this.providerModes[key] ?? 'count') === 'dot' && (Number(n) || 0) > 0,
      )
    },

    /** 聚合未读数（count 模式合计，供可操控菜单等旧消费端使用） */
    unreadCount(): number {
      return this.totalUnread
    },

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
      this.providerModes[provider.key] = provider.mode ?? 'count'
    },

    /**
     * 移除一个通知 provider（插件卸载时调用）。
     * 移除后核心照常运行，只是不再为该项拉取徽章；其未读数与模式同步移除，
     * 不再计入头像总数。
     */
    unregisterProvider(key: string): void {
      providers.delete(key)
      // 未读数与模式同步移除（重建对象而非动态 delete，保持响应式与 lint 约束）
      this.providerCounts = Object.fromEntries(
        Object.entries(this.providerCounts).filter(([k]) => k !== key),
      )
      this.providerModes = Object.fromEntries(
        Object.entries(this.providerModes).filter(([k]) => k !== key),
      )
    },

    /** 返回已注册的 provider 列表（模块级，非响应式） */
    getProviders(): NotifyProvider[] {
      return Array.from(providers.values())
    },

    /**
     * 【统一写入口】写入某 key 的未读数：
     * providerCounts（驱动头像总数/菜单徽章）+ 头部动作徽章同步。
     * setCount / incr / decr / fetch 均经由本方法，保证各消费端同源联动。
     */
    applyCount(key: string, count: number): void {
      const n = Math.max(0, Math.floor(Number(count) || 0))
      this.providerCounts[key] = n
      useSystemStore().setHeaderActionBadge(key, n)
    },

    // ====== 主动驱动 API（其他插件不改消费端代码，任意时机调用即全端联动） ======

    /** 设置某 key 未读数（无需注册 provider） */
    setCount(key: string, count: number): void {
      this.applyCount(key, count)
    },

    /** 增加未读数（如收到新消息推送），默认 +1 */
    incr(key: string, step: number = 1): void {
      this.applyCount(key, (Number(this.providerCounts[key]) || 0) + step)
    },

    /** 减少未读数（如单条标记已读），默认 -1，下限 0 */
    decr(key: string, step: number = 1): void {
      this.applyCount(key, (Number(this.providerCounts[key]) || 0) - step)
    },

    /** 清零：传 key 只清该项（如全部已读），缺省清空全部（如登出） */
    clear(key?: string): void {
      if (key) {
        this.applyCount(key, 0)
        return
      }
      for (const k of Object.keys(this.providerCounts)) {
        this.applyCount(k, 0)
      }
    },

    /**
     * 精准拉取：仅刷新某个 provider 的未读数（需已注册），返回最新值（未注册返回 null）。
     * 页面局部操作后同步徽章用它替代全量 fetchUnread，避免重拉其它源。
     */
    async fetchCount(key: string): Promise<number | null> {
      const provider = providers.get(key)
      if (!provider) return null
      this.providerModes[key] = provider.mode ?? 'count'
      this.checkDebugMode()
      try {
        const count = this.isDebug ? this.getMockUnreadCount() : Number(await provider.fetchUnread()) || 0
        this.applyCount(key, count)
        return count
      } catch {
        // 拉取失败不影响其它源，本源按 0 处理
        this.applyCount(key, 0)
        return 0
      }
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

      // 空 provider：核心仍可运行（主动驱动 setCount 的 key 照常计入总数）
      const list = this.getProviders()
      if (list.length === 0) {
        this.applyBadges(this.totalUnread)
        return this.totalUnread
      }

      let maxCount = 0
      await Promise.all(
        list.map(async (provider) => {
          // 模式表随 fetch 同步（模块级注册不经过 store action，此处兜底）
          this.providerModes[provider.key] = provider.mode ?? 'count'
          try {
            const count = shouldUseMock
              ? this.getMockUnreadCount()
              : Number(await provider.fetchUnread()) || 0

            if (count > maxCount) maxCount = count
            // 每个 provider 各自写入统一入口（按来源展示 + 头部动作徽章同步）
            this.applyCount(provider.key, count)
          } catch {
            // 单个 provider 失败不影响其它 provider
            this.applyCount(provider.key, 0)
          }
        })
      )

      // 更新可操控菜单的 DOM 徽章（headerAction 徽章已由各 provider 分别写入）
      this.applyBadges(this.totalUnread)
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
          } catch {
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
