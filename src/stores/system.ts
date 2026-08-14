import { defineStore } from 'pinia'
import { useNuxtApp } from 'nuxt/app'
import { useRuntimeConfig } from '#imports'
import storage from '~/utils/storage'
import type { Menus, RoutingMode, HeaderActionConfig } from './interface'
import { LinkTarget, MenuType } from './interface'
import { getRoutingConfig } from '~/api/site'
import type { RoutingConfig } from '~/api/site/types'
import { collectRoutes } from '~/router/routes-collector'
import { buildFrontendMenu, mergeMenus } from '~/utils/menu-builder'
import { loadAllLocaleMessages } from '~/plugins/i18n'
import { useMemberStore } from './member'
import { useConfigStore } from './config'

interface System {
  lang: string
  tenantId: string | number | null
  site: Record<string, any>
  /** 当前生效的路由菜单模式（运行期覆盖后写入） */
  routingMode: RoutingMode
  /** PC 导航栏固定显示的一级菜单数量，超出部分收纳到"更多" */
  navMaxVisibleItems: number
  /** 后端菜单 code 集合（backend/hybrid 模式下用于校验非公开路由有效性） */
  backendMenuCodes: string[]
  /** 头部动作菜单版本号：任何外部注册/更新/徽章变更均自增，用于触发 getter 重算 */
  headerActionVersion: number
}

const availableLanguages = [
  { name: 'zh-cn', value: '中文' },
  { name: 'en', value: 'English' }
]

/**
 * 模块级头部动作「覆写注册表」。
 * 存放外部插件/页面通过 registerHeaderAction / updateHeaderAction / setHeaderActionBadge
 * 注册的配置与徽章，以及自定义 onClick 回调（函数无法序列化，单独存于此）。
 * 与 site.header_actions（路由/后端收集）合并后产出最终列表。
 * 放在模块作用域而非 pinia state，可持久保存函数型 onClick，且重 init 不丢失徽章。
 */
const headerActionOverrides = new Map<string, {
  config?: Partial<Menus>
  badge?: string | number
  visible?: boolean
  onClick?: () => void | Promise<void>
}>()

/** 仅当覆写中包含 badge 时返回徽章补丁，否则返回空对象 */
function buildBadgePatch(ov?: {
  config?: Partial<Menus>
  badge?: string | number
  visible?: boolean
  onClick?: () => void | Promise<void>
}): Record<string, any> {
  if (!ov || ov.badge === undefined) return {}
  return { badge: ov.badge }
}

/** 权限码归一化为数组 */
function normalizePerms(perm: string | string[] | undefined): string[] {
  if (!perm) return []
  if (Array.isArray(perm)) return perm
  return String(perm).split(',').map(p => p.trim()).filter(Boolean)
}

export const useSystemStore = defineStore('system', {
  state: (): System => {
    const storedLang = storage.get('lang');
    return {
      lang: storedLang ?? 'zh-cn',
      tenantId: null,
      routingMode: (useRuntimeConfig().public.ROUTING_MODE === 'frontend' ? 'frontend' : 'backend') as RoutingMode,
      navMaxVisibleItems: 10,
      backendMenuCodes: [],
      headerActionVersion: 0,
      site: {
        site_name: 'madong',
        record_number: 'test',
        version: 'v1.0.1',
        upload: {
          mode: 'local',
        },
        nav_menu: [],
        member_menu: [],
        /** 头部动作菜单（category='3'）：导航栏右侧扩展入口，如消息铃铛 */
        header_actions: [],
        initialize: false,
        user_initialize: false,
        menu_expand: false
      }
    }
  },

  getters: {
    getLanguages: () => availableLanguages,

    getCurrentLanguage: (state) => {
      return availableLanguages.find(lang => lang.name === state.lang) || availableLanguages[0]
    },

    headNav: (state) => {
      return state.site.nav_menu || []
    },

    navMenu: (state) => {
      return state.site.nav_menu || []
    },

    memberMenu: (state) => {
      return state.site.member_menu || []
    },

    /** PC 导航栏固定显示的一级菜单（前 navMaxVisibleItems 项） */
    visibleNavMenu: (state) => {
      const menu = state.site.nav_menu || []
      return menu.slice(0, state.navMaxVisibleItems)
    },

    /** PC 导航栏溢出的一级菜单（超出 navMaxVisibleItems 的部分） */
    overflowNavMenu: (state) => {
      const menu = state.site.nav_menu || []
      return menu.slice(state.navMaxVisibleItems)
    },

    isInitialized: (state) => {
      return state.site.initialize
    },

    /**
     * 头部动作菜单（category='3'）最终列表。
     * 合并 site.header_actions（路由/后端收集）与模块级覆写注册表（外部注册/更新/徽章）。
     * 读取 headerActionVersion 以在外部变更时触发重算；按权限过滤（未登录隐藏需登录项）。
     */
    headerActions: (state) => {
      // 触碰版本号，确保外部 setHeaderActionBadge / registerHeaderAction 触发响应式重算
      void state.headerActionVersion

      const base: Menus[] = state.site.header_actions || []
      const result: Menus[] = []

      // 1) 合并路由/后端收集到的项与同名覆写
      base.forEach((m) => {
        const key = m.id || m.path || ''
        const ov = headerActionOverrides.get(key)
        if (ov && ov.visible === false) return
        const merged: Menus = { ...m }
        if (ov?.config) {
          // 合并菜单基础字段（path/title/icon/order 等）
          Object.assign(merged, ov.config)
        }
        // 合并 meta：保留原 type 等必填字段，再叠加覆写 meta 与徽章
        const mergedMeta: Record<string, any> = { ...(merged.meta || {}) }
        if (ov?.config?.meta) Object.assign(mergedMeta, ov.config.meta)
        const badgePatch = buildBadgePatch(ov)
        if (badgePatch.badge !== undefined) mergedMeta.badge = badgePatch.badge
        merged.meta = mergedMeta as any
        result.push(merged)
      })

      // 2) 追加纯外部注册（不在 base 中的项）
      headerActionOverrides.forEach((ov, key) => {
        if (ov.visible === false) return
        if (base.some(m => (m.id || m.path) === key)) return
        const cfg = ov.config || {}
        const menu: Menus = {
          id: key,
          name: cfg.title || cfg.name || key,
          type: MenuType.PAGE,
          path: (ov.config?.path as string) || (cfg.path as string) || key,
          title: cfg.title || key,
          url: (ov.config?.url as string) || (cfg.url as string) || (ov.config?.path as string) || (cfg.path as string) || key,
          icon: cfg.icon || 'mdi:bell',
          sort: (cfg.order as number) ?? 0,
          permissions: normalizePerms(cfg.permission as any),
          meta: {
            type: MenuType.PAGE,
            target: (cfg.target as LinkTarget) || LinkTarget.SELF,
            is_public: cfg.is_public,
            is_no_auth: cfg.is_no_auth,
            permissions: normalizePerms(cfg.permission as any),
            badge: ov.badge ?? (cfg.badge as string | number) ?? 0,
            ...(cfg.meta || {}),
          } as any,
        }
        result.push(menu)
      })

      // 3) 按 order 排序后返回（登录/权限可见性过滤在渲染组件内按 checkMenuPermission 处理）
      return result.sort((a, b) => ((a.sort || 0) - (b.sort || 0)))
    },
  },

  actions: {
    // 初始化语言设置（仅在客户端执行）
    initLanguage() {
      if (process.client) {
        const storedLang = storage.get('lang');
        if (storedLang && storedLang !== this.lang) {
          this.lang = storedLang;
          this.updateI18nLocale(storedLang);
        }
      }
    },

    setLanguage(name: string) {
      if (!availableLanguages.some(lang => lang.name === name)) {
        console.warn(`不支持的语言代码: ${name}`)
        return false
      }

      this.lang = name
      storage.set({ key: 'lang', data: name })

      const nuxtApp = useNuxtApp()
      // $i18n 即 vue-i18n 全局 Composer（legacy:false 模式）
      const composer = (nuxtApp as any).$i18n
      if (composer) {
        // 按需加载目标 locale 的语言包并注册（无需刷新即可生效）
        composer.setLocaleMessage(name, loadAllLocaleMessages(name))
        // legacy:false 下 locale 是响应式 Ref，赋值即触发全局重渲染
        if (typeof composer.locale === 'object' && 'value' in (composer.locale as any)) {
          ;(composer.locale as any).value = name
        } else {
          composer.locale = name
        }
      }

      this.triggerLanguageChange()

      return true
    },

    setTenantId(tenantId: string | number | null) {
      this.tenantId = tenantId
    },

    updateI18nLocale(locale: string) {
      const nuxtApp = useNuxtApp()
      // $i18n 即 vue-i18n 全局 Composer（legacy:false 模式）
      const composer = (nuxtApp as any).$i18n
      if (!composer) return

      // 确保目标 locale 语言包已注册（首次切换时按需加载）
      const existing = composer.getLocaleMessage ? composer.getLocaleMessage(locale) : {}
      if (!existing || Object.keys(existing).length === 0) {
        composer.setLocaleMessage(locale, loadAllLocaleMessages(locale))
      }

      // legacy:false 下 locale 是响应式 Ref，赋值即触发全局重渲染
      if (typeof composer.locale === 'object' && 'value' in (composer.locale as any)) {
        ;(composer.locale as any).value = locale
      } else {
        composer.locale = locale
      }
    },

    triggerLanguageChange() {
      if (process.client) {
        window.dispatchEvent(new CustomEvent('languageChanged', {
          detail: { locale: this.lang }
        }))
      }
    },

    toggleMenuExpand(_expand: boolean) {
      const status = this.site.menu_expand
      this.site.menu_expand = _expand !== undefined ? _expand : !status
    },

    async getSiteInfoFn(forceRefresh = false) {
      try {
        // 检查是否已经初始化且不需要强制刷新
        if (this.site.initialize && !forceRefresh) {
          // 确保menu_expand状态被正确恢复
          const savedMenuExpand = storage.get('system-store')?.site?.menu_expand
          if (savedMenuExpand !== undefined) {
            this.site.menu_expand = savedMenuExpand
          }
          return {
            nav_menu: this.site.nav_menu || [],
            member_menu: this.site.member_menu || []
          }
        }

        // 保存当前的menu_expand状态
        const currentMenuExpand = this.site.menu_expand

        // 解析最终路由菜单模式：运行期后端配置 > 构建期环境变量 > 默认 backend
        const buildMode: RoutingMode = useRuntimeConfig().public.ROUTING_MODE as RoutingMode
          || 'backend'
        let navMenu: Menus[] = []
        let memberMenu: Menus[] = []
        let headerActions: Menus[] = []

        try {
          // 运行期覆盖：后端可下发 routing_mode 与前端模式可见性/权限
          const routingConfig = await getRoutingConfig().catch(() => null) as RoutingConfig | null
          const runtimeMode = routingConfig?.routing_mode
          const validModes: RoutingMode[] = ['frontend', 'backend', 'hybrid']
          const finalMode: RoutingMode =
            validModes.includes(runtimeMode as RoutingMode) ? runtimeMode as RoutingMode : buildMode

          this.routingMode = finalMode

          // 后端可下发 PC 导航最大显示数
          if (routingConfig?.max_nav_items && routingConfig.max_nav_items > 0) {
            this.navMaxVisibleItems = routingConfig.max_nav_items
          }

          if (finalMode === 'frontend') {
            // 前端模式：由 routes 生成菜单骨架，叠加后端权限/可见性过滤
            const allRoutes = collectRoutes()
            const skeleton = buildFrontendMenu(allRoutes)
            const visibility = routingConfig?.menu_visibility || {}
            navMenu = this.applyVisibility(skeleton.nav, visibility)
            memberMenu = this.applyVisibility(skeleton.member, visibility)
            headerActions = this.applyVisibility(skeleton.headerActions, visibility)
          } else if (finalMode === 'hybrid') {
            // 混合模式：后端菜单为主骨架 + 前端路由菜单补充
            const allMenus = routingConfig?.menus || []
            // 收集后端菜单 codes，供 auth 中间件校验非公开路由有效性
            this.backendMenuCodes = allMenus
              .map((m: any) => m.code)
              .filter((c: string) => c)
            const navMenuItems = allMenus.filter((menu: any) => String(menu.category) === '1') || []
            const memberMenuItems = allMenus.filter((menu: any) => String(menu.category) === '2') || []
            const headerActionItems = allMenus.filter((menu: any) => String(menu.category) === '3') || []
            const backendNav = this.buildMenuTree(navMenuItems)
            const backendMember = this.buildMenuTree(memberMenuItems)
            const backendHeaderActions = this.buildMenuTree(headerActionItems)

            const allRoutes = collectRoutes()
            const frontendSkeleton = buildFrontendMenu(allRoutes)
            const visibility = routingConfig?.menu_visibility || {}
            const frontendNav = this.applyVisibility(frontendSkeleton.nav, visibility)
            const frontendMember = this.applyVisibility(frontendSkeleton.member, visibility)
            const frontendHeaderActions = this.applyVisibility(frontendSkeleton.headerActions, visibility)

            const merged = mergeMenus(
              backendNav, backendMember, frontendNav, frontendMember,
              backendHeaderActions, frontendHeaderActions,
            )
            navMenu = merged.nav
            memberMenu = merged.member
            headerActions = merged.headerActions
          } else {
            // 后端模式：拉取后端菜单并按 pid 组树
            const allMenus = routingConfig?.menus || []
            // 收集后端菜单 codes，供 auth 中间件校验非公开路由有效性
            this.backendMenuCodes = allMenus
              .map((m: any) => m.code)
              .filter((c: string) => c)
            const navMenuItems = allMenus.filter((menu: any) => String(menu.category) === '1') || []
            const memberMenuItems = allMenus.filter((menu: any) => String(menu.category) === '2') || []
            const headerActionItems = allMenus.filter((menu: any) => String(menu.category) === '3') || []
            navMenu = this.buildMenuTree(navMenuItems)
            memberMenu = this.buildMenuTree(memberMenuItems)
            headerActions = this.buildMenuTree(headerActionItems)
          }
        } catch (menuError) {
          console.error('初始化菜单失败:', menuError)
        }

        // 初始化时不做权限过滤，因为还没有登录，没有会员信息
        // 后续会在其他地方进行权限检查
        const processedNavMenu = this.processNavMenu(navMenu)

        // 更新状态，保留当前的menu_expand状态
        this.site = {
          ...this.site,
          nav_menu: processedNavMenu,
          member_menu: memberMenu,
          header_actions: headerActions,
          initialize: true,
          menu_expand: currentMenuExpand
        }

        // 加载前端配置（搜索、统计等）
        const configStore = useConfigStore()
        await configStore.initAllConfigs()

        return {
          nav_menu: processedNavMenu,
          member_menu: memberMenu
        }
      } catch (error) {
        console.error('获取站点信息失败:', error)
        return null
      }
    },

    /**
     * 构建层级菜单树
     */
    buildMenuTree(menuItems: any[]): Menus[] {
      const menuMap = new Map<string, Menus>()
      const rootMenus: Menus[] = []

      // 第一步：转换所有菜单项为前端格式并放入映射
      menuItems.forEach((item: any) => {
        const menu: Menus = {
          id: item.id,
          name: item.name || item.title || '',
          type: this.convertMenuType(item.type),
          path: item.url || item.path || '',
          title: item.name || item.title || '',
          url: item.url || '',
          icon: item.icon || '',
          sort: item.sort ?? 0,
          code: item.code || '',
          permissions: item.permissions || item.code || [],
            meta: {
                type: this.convertMenuType(item.type),
                target: item.target ? this.convertTarget(item.target) : LinkTarget.SELF,
                // 后端菜单携带 is_public、is_no_auth 和 code
                is_public: item.is_public,
                is_no_auth: item.is_no_auth,
                code: item.code || '',
                permissions: item.meta?.permissions || item.code || [],
                ...(item.meta || {}),
                ...(item.extra || {}),
            },
          extra: item.extra || {},
          children: []
        }
        // 统一 ID 类型为字符串，避免类型不匹配问题
        menuMap.set(String(item.id), menu)
      })

      // 第二步：构建树结构
      menuItems.forEach((item: any) => {
        const menu = menuMap.get(String(item.id))
        if (!menu) return

        // 检查是否为根菜单：pid 为 0、"0" 或空值
        const pid = String(item.pid).trim()
        if (pid === "0" || !pid) {
          // 根菜单
          rootMenus.push(menu)
        } else {
          // 子菜单
          const parent = menuMap.get(pid)
          if (parent) {
            if (!parent.children) {
              parent.children = []
            }
            parent.children.push(menu)
          } else {
            // 如果父菜单不存在，将当前菜单作为根菜单处理
            rootMenus.push(menu)
          }
        }
      })

      // 第三步：排序菜单
      return this.sortMenus(rootMenus)
    },

    /**
     * 处理导航菜单
     */
    processNavMenu(navMenu: Menus[]): Menus[] {
      const processedMenu = [...navMenu]
      const hasHomeMenu = processedMenu.some((menu: Menus) => menu.url === '/' || menu.path === '/')

      if (!hasHomeMenu) {
        const homeMenu: Menus = {
          id: '-1',
          name: '首页',
          type: MenuType.PAGE,
          path: '/',
          title: '首页',
          url: '/',
          meta: {
            type: MenuType.PAGE,
            target: LinkTarget.SELF
          }
        }
        processedMenu.unshift(homeMenu)
      } else {
        const homeIndex = processedMenu.findIndex((menu: Menus) => menu.url === '/' || menu.path === '/')
        if (homeIndex > 0) {
          const homeMenu = processedMenu.splice(homeIndex, 1)[0]
          if (homeMenu) {
            processedMenu.unshift(homeMenu)
          }
        }
      }

      return processedMenu
    },

    /**
     * 前端路由菜单模式下，按运行期下发的可见性映射裁剪/覆盖菜单项。
     * @param menus 菜单树
     * @param visibility path -> { visible, permissions, is_public, code, is_no_auth }
     */
    applyVisibility(menus: Menus[], visibility: Record<string, any>): Menus[] {
      if (!visibility || !Object.keys(visibility).length) return menus

      return menus.filter((menu) => {
        const path = menu.path || ''
        const cfg = visibility[path]
        if (cfg && cfg.visible === false) {
          return false
        }
        // 运行期覆盖 is_public
        if (cfg && cfg.is_public !== undefined) {
          menu.meta = { ...menu.meta!, is_public: cfg.is_public } as any
        }
        // 运行期覆盖 is_no_auth
        if (cfg && cfg.is_no_auth !== undefined) {
          menu.meta = { ...menu.meta!, is_no_auth: cfg.is_no_auth } as any
        }
        // 运行期覆盖 code
        if (cfg && cfg.code) {
          menu.meta = { ...menu.meta!, code: cfg.code } as any
          menu.code = cfg.code
        }
        // 运行期覆盖 permissions
        if (cfg && cfg.permissions) {
          const perms = Array.isArray(cfg.permissions)
            ? cfg.permissions
            : String(cfg.permissions).split(',').map((p: string) => p.trim()).filter(Boolean)
          menu.meta = { ...menu.meta!, permissions: perms } as any
          menu.permissions = perms
        }
        if (menu.children && menu.children.length > 0) {
          menu.children = this.applyVisibility(menu.children, visibility)
        }
        return true
      })
    },

    /**
     * 追加菜单到导航菜单
     * @param menu 菜单项
     * @param index 插入位置：正数从前面（0开始），负数从后面（-1最后，-2倒数第二），不传默认最后
     * @param checkExists 是否检查已存在（默认true）
     */
    appendNavMenu(menu: Menus, index?: number, checkExists: boolean = true) {
      if (!this.site.nav_menu) {
        this.site.nav_menu = []
      }
      // 检查是否已存在
      if (checkExists) {
        const exists = this.site.nav_menu.some((m: Menus) => m.path === menu.path || m.id === menu.id)
        if (exists) return false
      }

      // 处理插入位置
      if (index === undefined) {
        // 默认追加到最后
        this.site.nav_menu.push(menu)
      } else if (index >= 0) {
        // 正数：从前面插入到指定位置
        const insertIndex = Math.min(index, this.site.nav_menu.length)
        this.site.nav_menu.splice(insertIndex, 0, menu)
      } else {
        // 负数：从后面倒数插入
        // -1 表示最后（等同于 push），-2 表示倒数第二
        const insertIndex = Math.max(this.site.nav_menu.length + index + 1, 0)
        this.site.nav_menu.splice(insertIndex, 0, menu)
      }
      return true
    },

    /**
     * 更新导航菜单项
     * @param path 菜单路径
     * @param updates 更新的属性
     */
    updateNavMenuItem(path: string, updates: Partial<Menus>) {
      const menu = this.site.nav_menu?.find((m: Menus) => m.path === path)
      if (menu) {
        Object.assign(menu, updates)
        return true
      }
      return false
    },

    /**
     * 移除导航菜单项
     * @param path 菜单路径
     */
    removeNavMenu(path: string) {
      if (!this.site.nav_menu) return false
      const index = this.site.nav_menu.findIndex((m: Menus) => m.path === path)
      if (index > -1) {
        this.site.nav_menu.splice(index, 1)
        return true
      }
      return false
    },

    /**
     * 头部动作菜单 —— 外部注册 / 重写接口
     *
     * 默认不预置任何 category='3' 项；其他插件/页面可通过以下方法注册或覆写
     * 头部右侧入口（如消息铃铛），实现自定义图标、徽章、跳转与点击行为。
     * 覆写保存在模块级 Map，重 init 不丢失；变更自增 headerActionVersion 触发重算。
     */

    /** 解析覆写匹配键（优先 path，其次 id） */
    resolveHeaderActionKey(action: HeaderActionConfig): string {
      return (action.path || action.id || action.title || '') as string
    },

    /**
     * 注册 / 全量重写一个头部动作项。
     * @param action 配置（path/id/title/icon/is_public/permission/order/badge/onClick...）
     * @returns 注册键
     */
    registerHeaderAction(action: HeaderActionConfig): string {
      const key = this.resolveHeaderActionKey(action)
      if (!key) {
        console.warn('[registerHeaderAction] 缺少 path 或 id，注册失败')
        return ''
      }
      const existing = headerActionOverrides.get(key) || {}
      headerActionOverrides.set(key, {
        ...existing,
        config: { ...(existing.config || {}), ...action } as Partial<Menus>,
        badge: action.badge !== undefined ? action.badge : existing.badge,
        onClick: action.onClick || existing.onClick,
        visible: action.visible !== undefined ? action.visible : existing.visible,
      })
      this.headerActionVersion++
      return key
    },

    /**
     * 局部更新已注册的头部动作项（不存在则按 key 新建）。
     * @param key path 或 id
     * @param patch 需更新的字段（含 badge / visible / onClick / 任意菜单字段）
     */
    updateHeaderAction(key: string, patch: Partial<HeaderActionConfig> & { visible?: boolean }) {
      const existing = headerActionOverrides.get(key) || {}
      const next = { ...existing }
      if (patch.badge !== undefined) next.badge = patch.badge
      if (patch.visible !== undefined) next.visible = patch.visible
      if (patch.onClick !== undefined) next.onClick = patch.onClick
      // 其余字段并入 config
      const { badge, visible, onClick, ...rest } = patch
      next.config = { ...(existing.config || {}), ...rest } as Partial<Menus>
      headerActionOverrides.set(key, next)
      this.headerActionVersion++
    },

    /**
     * 仅更新某个头部动作项的徽章计数（最常用：消息未读数）。
     * @param key path 或 id
     * @param count 计数（0 表示清空隐藏；>99 在组件内显示为 99+）
     */
    setHeaderActionBadge(key: string, count: string | number) {
      const existing = headerActionOverrides.get(key) || {}
      headerActionOverrides.set(key, { ...existing, badge: count })
      this.headerActionVersion++
    },

    /**
     * 设置某个头部动作项的可见性（如登录后显示、登出后隐藏）。
     * @param key path 或 id
     * @param visible 是否可见
     */
    setHeaderActionVisible(key: string, visible: boolean) {
      const existing = headerActionOverrides.get(key) || {}
      headerActionOverrides.set(key, { ...existing, visible })
      this.headerActionVersion++
    },

    /**
     * 移除一个头部动作项（同时清掉徽章/回调）。
     * @param key path 或 id
     */
    removeHeaderAction(key: string) {
      if (headerActionOverrides.delete(key)) {
        this.headerActionVersion++
      }
    },

    /**
     * 获取某头部动作项的自定义点击回调（若存在）。
     * 组件点击时优先执行该回调（如展开消息面板），否则按路由/外链跳转。
     * @param key path 或 id
     */
    getHeaderActionClickHandler(key: string): (() => void | Promise<void>) | undefined {
      return headerActionOverrides.get(key)?.onClick
    },

    /** 清空全部头部动作覆写（调试/重置用） */
    clearHeaderActions() {
      headerActionOverrides.clear()
      this.headerActionVersion++
    },


    /**
     * 转换菜单类型
     */
    convertMenuType(type: any): MenuType {
      const typeMap: Record<string, MenuType> = {
        1: MenuType.DIRECTORY, // 目录
        2: MenuType.PAGE,       // 导航菜单（内部链接）
        3: MenuType.LINK,       // 外部链接
        4: MenuType.PAGE        // 单页面（内部链接）
      }
      return typeMap[type] || MenuType.PAGE
    },

    /**
     * 转换目标窗口
     */
    convertTarget(target: any): LinkTarget {
      const targetMap: Record<string, LinkTarget> = {
        1: LinkTarget.SELF,
        2: LinkTarget.BLANK
      }
      return targetMap[target] || LinkTarget.SELF
    },

    /**
     * 排序菜单
     */
    sortMenus(menus: Menus[]): Menus[] {
      return menus.sort((a, b) => (a.sort || 0) - (b.sort || 0)).map(menu => {
        if (menu.children && menu.children.length > 0) {
          menu.children = this.sortMenus(menu.children)
        }
        return menu
      })
    },

    isExternalLink(menu: Menus): boolean {
      return menu.type === MenuType.LINK && !!menu.url
    },

    isDirectory(menu: Menus): boolean {
      return menu.type === MenuType.DIRECTORY
    },

    hasChildren(menu: Menus): boolean {
      return !!menu.children && menu.children.length > 0
    },

    getTarget(menu: Menus): string {
      return menu.meta?.target || '_self'
    },

    shouldNavigate(menu: Menus): boolean {
      if (this.isDirectory(menu)) {
        return false
      }
      if (this.isExternalLink(menu)) {
        return false
      }
      return !!menu.path
    },

    findMenuById(id: number, menus?: Menus[]): Menus | null {
      const menuList = menus || this.headNav

      for (const menu of menuList) {
        if (menu.id === id) {
          return menu
        }
        if (menu.children && menu.children.length > 0) {
          const found = this.findMenuById(id, menu.children)
          if (found) return found
        }
      }
      return null
    },

    findMenuByPath(path: string, menus?: Menus[]): Menus | null {
      const menuList = menus || this.headNav

      for (const menu of menuList) {
        if (menu.path === path) {
          return menu
        }
        if (menu.children && menu.children.length > 0) {
          const found = this.findMenuByPath(path, menu.children)
          if (found) return found
        }
      }
      return null
    },

    getMenuTarget(menu: Menus): string | null {
      if (this.isDirectory(menu)) {
        return null
      }
      if (this.isExternalLink(menu)) {
        return menu.url || null
      }
      return menu.path || null
    },

    /**
     * 检查菜单权限
     *
     * 综合判断逻辑：
     *   1. is_public === true（默认） → 公开菜单，无需权限即可显示
     *   2. is_public !== true → 需登录
     *      - 未登录 → 不显示
     *      - 已登录 + is_no_auth=true → 跳过权限码校验，直接可访问
     *      - 已登录 → 检查 code / permissions 权限码
     *        - 无权限码 → 已登录即可显示
     *        - 有权限码 → 校验用户是否持有对应权限
     */
    checkMenuPermission(menu: Menus): boolean {
      const memberStore = useMemberStore()

      // 公开菜单直接通过
      const isPublic = menu.meta?.is_public !== false
        && menu.meta?.is_public !== 0
        && menu.meta?.is_public !== '0'

      if (isPublic) {
        return true
      }

      // 非公开菜单 → 必须登录
      if (!memberStore.info) {
        return false
      }

      // is_no_auth=true → 已登录即可，跳过权限码校验
      const isNoAuth = menu.meta?.is_no_auth === true
        || menu.meta?.is_no_auth === 1
        || menu.meta?.is_no_auth === '1'
      if (isNoAuth) {
        return true
      }

      const userPermissions = memberStore.info?.permissions || []

      // 超级权限码 [*] → 全部通过
      if (userPermissions.includes('*')) {
        return true
      }

      // 收集所需权限码（code + permissions 合并）
      const requiredPermissions: string[] = []

      // code 权限码
      const code = menu.meta?.code || menu.code
      if (code) {
        if (typeof code === 'string') {
          requiredPermissions.push(...code.split(',').map(p => p.trim()).filter(p => p))
        } else if (Array.isArray(code)) {
          requiredPermissions.push(...code)
        }
      }

      // permissions 权限码（兼容原有格式）
      const menuPerms = menu.meta?.permissions || menu.permissions
      if (menuPerms) {
        if (typeof menuPerms === 'string') {
          requiredPermissions.push(...menuPerms.split(',').map(p => p.trim()).filter(p => p))
        } else if (Array.isArray(menuPerms)) {
          requiredPermissions.push(...menuPerms)
        }
      }

      // 去重
      const uniqueRequired = [...new Set(requiredPermissions)]

      // 无权限码 → 已登录即可访问
      if (uniqueRequired.length === 0) {
        return true
      }

      // 校验用户是否持有任一所需权限码
      return uniqueRequired.some(permission => userPermissions.includes(permission))
    },

    /**
     * 过滤有权限的菜单
     */
    filterMenuByPermission(menus: Menus[]): Menus[] {
      return menus.filter(menu => {
        // 检查当前菜单权限
        if (!this.checkMenuPermission(menu)) {
          return false
        }

        // 递归检查子菜单
        if (menu.children && menu.children.length > 0) {
          menu.children = this.filterMenuByPermission(menu.children)
          // 如果子菜单都被过滤掉了，当前菜单也不显示
          return menu.children.length > 0
        }

        return true
      })
    },

    /**
     * 校验 route code 是否在后端菜单 code 集合中（backend/hybrid 模式）
     * 用于 auth 中间件拦截非公开路由：未在后端注册的路由 → 404
     */
    isValidBackendMenuCode(code: string): boolean {
      if (!code || this.backendMenuCodes.length === 0) return false
      return this.backendMenuCodes.includes(code)
    },
  }
})
