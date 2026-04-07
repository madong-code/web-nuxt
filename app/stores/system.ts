import { defineStore } from 'pinia'
import { useNuxtApp } from 'nuxt/app'
import storage from '@/utils/storage'
import type { Menus } from './interface'
import { LinkTarget, MenuType } from './interface'
import { getNavigationList } from '~/api/site'
import { useMemberStore } from './member'
import { useConfigStore } from './config'

interface System {
  lang: string
  site: Record<string, any>
}

const availableLanguages = [
  { name: 'zh-cn', value: '中文' },
  { name: 'en', value: 'English' }
]

export const useSystemStore = defineStore('system', {
  state: (): System => {
    const storedLang = storage.get('lang');
    return {
      lang: storedLang ?? 'zh-cn',
      site: {
        site_name: 'madong',
        record_number: 'test',
        version: 'v1.0.1',
        upload: {
          mode: 'local',
        },
        nav_menu: [],
        member_menu: [],
        initialize: false,
        user_initialize: false,
        menu_expand: false
      }
    }
  },

  // persist: {
  //   key: 'system-store',
  //   pick: ['lang', 'site']
  // },

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

    isInitialized: (state) => {
      return state.site.initialize
    }
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
      this.updateI18nLocale(name)
      this.triggerLanguageChange()

      return true
    },

    updateI18nLocale(locale: string) {
      const nuxtApp = useNuxtApp()
      const i18n = (nuxtApp as any).$i18n
      
      // 检查 i18n 的 locale 是否是响应式的
      if (i18n && i18n.locale !== locale) {
        // 尝试使用不同的方式更新 locale
        if (typeof i18n.setLocale === 'function') {
          i18n.setLocale(locale)
        } else if (i18n.locale && typeof i18n.locale.value !== 'undefined') {
          i18n.locale.value = locale
        } else {
          i18n.locale = locale
        }
        
        // 手动触发组件重新渲染
        if (process.client) {
          window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { locale: locale }
          }))
        }
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

        // 获取后端返回的二维数组菜单
        const allMenus = await getNavigationList() as any[] || []

        // 根据 category 字段分类菜单
        // category = 1: 导航菜单 (NAV)
        // category = 2: 会员菜单 (MEMBER)
        const navMenuItems = allMenus.filter((menu: any) => menu.category === 1) || []
        const memberMenuItems = allMenus.filter((menu: any) => menu.category === 2) || []

        // 构建层级菜单树
        const navMenu = this.buildMenuTree(navMenuItems)
        const memberMenu = this.buildMenuTree(memberMenuItems)

        // 初始化时不做权限过滤，因为还没有登录，没有会员信息
        // 后续会在其他地方进行权限检查
        const processedNavMenu = this.processNavMenu(navMenu)

        // 更新状态，保留当前的menu_expand状态
        this.site = {
          ...this.site,
          nav_menu: processedNavMenu,
          member_menu: memberMenu,
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
          name: item.name || '',
          type: this.convertMenuType(item.type),
          path: item.url || item.path || '',
          title: item.name || '',
          url: item.url || '',
          icon: item.icon || '',
          meta: {
            type: this.convertMenuType(item.type),
            target: item.target ? this.convertTarget(item.target) : LinkTarget.SELF,
            permissions: item.meta?.permissions || item.code || [],
            ...(item.meta || {})
          },
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
     */
    checkMenuPermission(menu: Menus): boolean {
      const memberStore = useMemberStore()
      const permissions = memberStore.info?.permissions || []

      // 如果用户有权限码 [*]，表示所有权限都有
      if (permissions.includes('*')) {
        return true
      }

      // 获取菜单权限码（支持字符串和数组）
      let menuPermissions: string[] = []
      if (menu.meta?.permissions) {
        if (typeof menu.meta.permissions === 'string') {
          // 如果是字符串，按逗号分割
          menuPermissions = menu.meta.permissions.split(',').map(p => p.trim()).filter(p => p)
        } else if (Array.isArray(menu.meta.permissions)) {
          menuPermissions = menu.meta.permissions
        }
      }

      // 如果菜单没有设置权限码，允许访问
      if (menuPermissions.length === 0) {
        return true
      }

      // 检查用户是否有菜单所需的任一权限
      return menuPermissions.some(permission => permissions.includes(permission))
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
    }
  }
})
