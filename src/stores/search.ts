import { defineStore } from 'pinia'
import type { Component } from 'vue'
import DefaultSearchBar from '~/layouts/components/search/default-bar.vue'
import DefaultSearchPanel from '~/layouts/components/search/default-panel.vue'

/**
 * 全站搜索注册表 store（框架默认兜底 + 插件可注册覆盖）
 *
 * 设计目标（与 notify.ts 同模式）：
 *  - 框架提供挂载点（layouts/components/search-bar.vue / search-panel.vue）、
 *    默认搜索实现（default-bar / default-panel + /search 默认搜索页）与本注册表；
 *    框架自身不 import 任何插件模块。
 *  - 无插件注册时挂载点渲染框架默认搜索（见 DEFAULT_SEARCH_PROVIDER），
 *    保证空框架也有可用的搜索入口与搜索页。
 *  - 插件（如 portal）通过自己的 Nuxt 插件（universal）注册搜索 UI 并声明
 *    更高 priority 即可整体覆盖默认搜索：
 *      useSearchStore().register({ id: 'portal', priority: 10, bar, panel })
 *    多插件可同时注册（registry 按 id 隔离互不踩），priority 最高者生效；
 *    卸载插件后注册文件消失，自动回落到更低优先级提供者或框架默认。
 *  - 组件本体（函数/组件引用）存模块级注册表，不进 pinia state（不可序列化内容与
 *    notify provider 同理）；state 仅存 id 快照驱动响应式渲染。
 *  - 聚合模式（SearchSource）：插件只注册数据源函数，搜索 UI 由框架统一实现，
 *    多源共存聚合展示（searchAll 错误隔离）。与覆盖模式的裁决：存在 active UI
 *    覆盖时搜索 UI 整体归覆盖者，聚合不参与；无覆盖时框架统一 UI + searchAll。
 */

export interface SearchProvider {
  /** 提供者标识（推荐插件名，如 'portal'；框架默认为 'default'） */
  id: string
  /** 优先级：数值越大越优先生效（框架默认 0，插件建议 10+；同值后注册者覆盖） */
  priority?: number
  /** 触发钮组件：渲染于 navbar / 移动抽屉，接收 embedded / showText / showShortcut 等 props */
  bar?: Component
  /** 悬浮搜索面板组件：框架 header 挂载一次，与触发钮通过提供者自身逻辑通讯 */
  panel?: Component
}

/** 标准化搜索结果项（聚合模式下框架统一渲染的最小单元） */
export interface SearchResultItem {
  title: string
  description?: string
  /** 站内跳转地址 */
  url: string
  /** 可选图标类名 */
  icon?: string
  /** 时间戳(ms)，供「最新」排序（缺省沉底） */
  time?: number
  /** 数值热度，供「最热」排序（缺省沉底） */
  heat?: number
  /** 源内子类型标注（如 文章/产品/下载） */
  kindLabel?: string
}

/** 插件注册的聚合数据源（聚合模式：插件只提供数据函数，UI 由框架统一实现） */
export interface SearchSource {
  /** 唯一标识 = 分组 id（推荐插件名，如 'portal'） */
  id: string
  /** 分组标题（缺省用 id） */
  title?: string
  /** 组序：数值越大越靠前（插件建议 10+；同值后注册者在前） */
  priority?: number
  search(keyword: string, opts?: { limit?: number }): Promise<SearchResultItem[]> | SearchResultItem[]
}

/** 单个数据源的搜索结果分组（error 存在时该源失败，items 为空） */
export interface SearchSourceGroup {
  source: SearchSource
  items: SearchResultItem[]
  error?: unknown
}

export interface SearchAllResult {
  groups: SearchSourceGroup[]
  flat: SearchResultItem[]
}

/** 模块级注册表：id → provider（组件引用等不可序列化内容） */
const registry = new Map<string, SearchProvider>()

/** 模块级数据源注册表：id → source（search 函数引用不可序列化，同 provider 模式） */
const sourceRegistry = new Map<string, SearchSource>()

/** 框架默认搜索提供者（常驻兜底，不进 registry；组件为本框架自带实现） */
const DEFAULT_SEARCH_PROVIDER: SearchProvider = {
  id: 'default',
  priority: 0,
  bar: DefaultSearchBar,
  panel: DefaultSearchPanel,
}

export const useSearchStore = defineStore('search', {
  state: () => ({
    /** 已注册 provider id 快照（驱动挂载点响应式渲染） */
    registeredIds: [] as string[],
    /** 已注册聚合数据源 id 快照（驱动 searchAll / 分组渲染响应式更新） */
    sourceIds: [] as string[],
  }),

  getters: {
    /** 当前生效的搜索提供者：注册者中 priority 最高者优先，无注册时回落框架默认 */
    active(state): SearchProvider {
      let best: SearchProvider | null = null
      let bestPriority = -Infinity
      for (const id of state.registeredIds) {
        const p = registry.get(id)
        if (!p) continue
        // 同优先级后注册者覆盖（>= 取后者），与热更新语义一致
        if ((p.priority ?? 0) >= bestPriority) {
          best = p
          bestPriority = p.priority ?? 0
        }
      }
      return best ?? DEFAULT_SEARCH_PROVIDER
    },

    /** 全部可用提供者（默认兜底 + 已注册，按优先级降序；供面板做多源切换等扩展） */
    all(state): SearchProvider[] {
      const list = [DEFAULT_SEARCH_PROVIDER]
      for (const id of state.registeredIds) {
        const p = registry.get(id)
        if (p) list.push(p)
      }
      return list.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    },

    /** 是否有搜索提供者（有框架默认兜底，恒为 true；挂载点据此恒渲染） */
    hasSearch(): boolean {
      return true
    },

    /** 已注册聚合数据源列表：priority 降序；同值后注册者在前（state.sourceIds 即注册顺序） */
    sourceList(state): SearchSource[] {
      const list: { source: SearchSource; idx: number }[] = []
      state.sourceIds.forEach((id, idx) => {
        const s = sourceRegistry.get(id)
        if (s) list.push({ source: s, idx })
      })
      return list
        .sort((a, b) => (b.source.priority ?? 0) - (a.source.priority ?? 0) || b.idx - a.idx)
        .map((x) => x.source)
    },
  },

  actions: {
    /** 注册搜索提供者（插件 Nuxt 插件内调用；相同 id 覆盖，便于热更新） */
    register(provider: SearchProvider): void {
      registry.set(provider.id, provider)
      if (!this.registeredIds.includes(provider.id)) {
        this.registeredIds.push(provider.id)
      }
    },

    /** 移除搜索提供者（插件卸载/登出场景；移除后自动回落框架默认） */
    unregister(id: string): void {
      registry.delete(id)
      this.registeredIds = this.registeredIds.filter((x) => x !== id)
    },

    /** 注册聚合数据源（插件 Nuxt 插件内调用；相同 id 覆盖，便于热更新） */
    registerSource(source: SearchSource): void {
      sourceRegistry.set(source.id, source)
      if (!this.sourceIds.includes(source.id)) {
        this.sourceIds.push(source.id)
      }
    },

    /** 移除聚合数据源（插件卸载场景；对应分组自动摘除） */
    unregisterSource(id: string): void {
      sourceRegistry.delete(id)
      this.sourceIds = this.sourceIds.filter((x) => x !== id)
    },

    /**
     * 聚合搜索：并发调用全部数据源，Promise.allSettled 错误隔离——
     * 单源失败仅其分组标记 error（items 置空），不影响其他源结果。
     * 返回分组视图（groups，按 sourceList 组序）与合并视图（flat）。
     */
    async searchAll(keyword: string, opts?: { limit?: number }): Promise<SearchAllResult> {
      const limit = opts?.limit ?? 6
      const sources = this.sourceList
      const settled = await Promise.allSettled(
        sources.map((s) => Promise.resolve(s.search(keyword, { limit }))),
      )
      const groups: SearchSourceGroup[] = []
      const flat: SearchResultItem[] = []
      settled.forEach((r, i) => {
        const source = sources[i] as SearchSource
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
          groups.push({ source, items: r.value })
          flat.push(...r.value)
        } else {
          groups.push({ source, items: [], error: r.status === 'rejected' ? r.reason : undefined })
        }
      })
      return { groups, flat }
    },
  },
})
