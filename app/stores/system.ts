import { defineStore } from 'pinia'
import storage from '@/utils/storage'
import type { Menus } from './interface'

interface System {
  lang: string
  site: Record<string, any>
}

// 支持的语言列表
const availableLanguages = [
  { name: 'zh-cn', value: '中文' },
  { name: 'en', value: 'English' }
]

const menus = [
  {
    "id": 1,
    "name": "community",
    "type": "menu",
    "path": "https://madong.tech",
    "title": "社区",
    "url": "https://www.baidu.com",
    "icon": "i-dashboard",
    "meta": {
      "id": 1,
      "type": "menu",
      "menu_type": "tab"
    }
  },
  {
    "id": 2,
    "name": "community",
    "type": "menu",
    "path": "/",
    "title": "模块市场",
    "url": "",
    "icon": "i-dashboard",
    "meta": {
      "id": 2,
      "type": "menu",
      "menu_type": "tab"
    }
  },
    {
    "id": 3,
    "name": "docs",
    "type": "menu",
    "path": "/",
    "title": "文档",
    "url": "",
    "icon": "i-dashboard",
    "meta": {
      "id": 3,
      "type": "menu",
      "menu_type": "tab"
    }
  },
  {
    "id": 4,
    "name": "demo",
    "type": "directory",
    "title": "演示站",
    "url": "",
    "icon": "i-settings",
    "meta": {
      "id": 4,
      "type": "directory",
      "menu_type": "tab"
    },
    "children": [
      {
        "id": 201,
        "name": "demo1",
        "type": "page",
        "path": "/demo/test1",
        "title": "演示站1",
        "url": "",
        "icon": "i-users",
        "meta": {
          "id": 201,
          "type": "page",
          "menu_type": "tab"
        },
        "children": []
      },
      {
        "id": 202,
        "name": "demo2",
        "type": "page",
        "path": "/demo/test2",
        "title": "演示站2",
        "url": "",
        "icon": "i-users",
        "meta": {
          "id": 202,
          "type": "page",
          "menu_type": "tab"
        },
        "children": []
      }
    ]
  },
  {
    "id": 5,
    "name": "code",
    "type": "directory",
    "title": "代码仓库",
    "url": "",
    "icon": "i-link",
    "meta": {
      "id": 5,
      "type": "directory",
      "menu_type": "tab"
    },
    "children": [
      {
        "id": 501,
        "name": "gitee",
        "type": "page",
        "path": "/code/gitee",
        "title": "Gitee",
        "url": "https://gitee.com",
        "icon": "i-book",
        "meta": {
          "id": 501,
          "type": "page",
          "menu_type": "link"
        },
        "children": []
      },
      {
        "id": 502,
        "name": "github",
        "type": "page",
        "path": "/external/support",
        "title": "GitHub",
        "url": "https://github.com",
        "icon": "i-help-circle",
        "meta": {
          "id": 502,
          "type": "page",
          "menu_type": "link"
        },
        "children": []
      }
    ]
  }
] as Menus[]

export const useSystemStore = defineStore('system', {
  state: (): System => {
    return {
      lang: storage.get('lang') ?? 'zh-cn',
      site: {
        site_name: '通用多应用管理系统后台框架',
        record_number: 'test',
        version: 'v1.0.1',
        upload: {
          mode: 'local',
        },
        head_nav: menus,
        initialize: false,
        user_initialize: false,
      }
    }
  },

  getters: {
    /**
     * 获取支持的语言列表
     */
    getLanguages: () => availableLanguages,

    /**
     * 获取当前语言信息
     */
    getCurrentLanguage: (state) => {
      return availableLanguages.find(lang => lang.code === state.lang) || availableLanguages[0]
    }
  },

  actions: {
    /**
     * 切换语言
     * @param name 语言名称
     */
    setLanguage(name: string) {
      // 验证语言代码是否支持
      if (!availableLanguages.some(lang => lang.name === name)) {
        console.warn(`不支持的语言代码: ${name}`)
        return false
      }

      this.lang = name
      // 保存到本地存储
      storage.set({ key: 'lang', data: name })
      
      // 触发 i18n 语言切换
      this.updateI18nLocale(name)

      // 触发语言切换事件，让组件重新渲染
      this.triggerLanguageChange()
      
      return true
    },

    /**
     * 更新 i18n 语言设置
     * @param locale 语言代码
     */
    updateI18nLocale(locale: string) {

      // 获取 i18n 实例并切换语言
      const nuxtApp = useNuxtApp()
      const i18n = (nuxtApp as any).$i18n
      if (i18n && i18n.locale !== locale) {
        i18n.locale = locale
      }
    },
    
    /**
     * 触发语言切换事件
     */
    triggerLanguageChange() {
      // 触发自定义事件，通知组件重新渲染
      if (process.client) {
        window.dispatchEvent(new CustomEvent('languageChanged', {
          detail: { locale: this.lang }
        }))
      }
    },

    async getSiteInfoFn() {
      // 原有逻辑保持不变
    }
  }
})

