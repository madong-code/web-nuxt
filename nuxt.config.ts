// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
import path from 'path'
import fs from 'fs'
// 提前加载 .env，确保 process.env 在 config 评估时可用
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env' })
if (process.env.NODE_ENV === 'development') {
  loadEnv({ path: '.env.development', override: true })
} else if (process.env.BUILD_TARGET === 'integrated') {
  loadEnv({ path: '.env.integrated' })
} else {
  loadEnv({ path: '.env.production' })
}

/**
 * 收集各插件的 Nuxt 插件文件（可插拔）。
 * 约定：`src/plugin/{name}/plugins/*.ts` 会被自动纳入 Nuxt 插件。
 * 插件移除后目录不存在即自动跳过，核心功能不受影响。
 */
function collectPluginPlugins(): string[] {
  const cwd = process.cwd()
  const pluginRoot = path.resolve(cwd, 'src', 'plugin')
  if (!fs.existsSync(pluginRoot)) return []
  const result: string[] = []
  for (const name of fs.readdirSync(pluginRoot)) {
    const pluginsDir = path.join(pluginRoot, name, 'plugins')
    if (!fs.existsSync(pluginsDir)) continue
    for (const file of fs.readdirSync(pluginsDir)) {
      if (file.endsWith('.ts')) {
        // 返回相对项目根的路径，与 Nuxt srcDir 解析保持一致
        result.push(path.relative(cwd, path.join(pluginsDir, file)))
      }
    }
  }
  return result
}

export default defineNuxtConfig({
  // 关闭 SSR，改为纯客户端渲染（SPA）
  // ssr: false,

  // 启用 src/ 目录布局（Nuxt 4 推荐）
  srcDir: 'src',

  // Nuxt 内部 watcher 改用轮询：默认 granular watcher 逐目录建 chokidar 实例，
  // fs-watch 会持久持有插件模板文件句柄，导致在线卸载/重装删除被拒（Windows）。
  // 轮询不持句柄；选项经 nuxt 内部 watchers.chokidar 透传（ignored 被内部覆盖不可用，
  // 也不得用顶层 ignore —— 那会把插件 SFC 排除出编译转换链，#components 解析直接 500）。
  // Vite 侧仍由下方 vite.server.watch.ignored 排除插件目录。
  watchers: {
    chokidar: {
      usePolling: true,
      interval: 1500,
      binaryInterval: 3000,
    },
  },

  // 可插拔插件：合并各插件目录内的 Nuxt 插件
  plugins: collectPluginPlugins(),

  modules: [
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@pinia/nuxt',
    '@element-plus/nuxt',
    'nuxt-icons',
    'pinia-plugin-persistedstate/nuxt'
  ],

  devtools: {
    enabled: true,
  },

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: {
        lang: 'zh-cn'
      }
    },
  },

  // 运行时配置（对应 .env / .env.development / .env.production）
  runtimeConfig: {
    // 服务端渲染时 API 内网地址（相对 /api 在 Node 端无法解析，必须为绝对地址）
    apiServerBase: process.env.NUXT_API_SERVER_BASE || 'http://127.0.0.1:8500/api',
    public: {
      API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
      // 站点名称兜底：后端站点配置缺失/未返回时（如重新安装后新库）使用此值展示
      SITE_NAME: process.env.NUXT_PUBLIC_SITE_NAME || 'MaDong',
      REQUEST_HEADER_CHANNEL_KEY: process.env.NUXT_PUBLIC_REQUEST_HEADER_CHANNEL_KEY || 'pc',
      REQUEST_HEADER_TOKEN_KEY: process.env.NUXT_PUBLIC_REQUEST_HEADER_TOKEN_KEY || 'Authorization',
      DEFAULT_LANG: process.env.NUXT_PUBLIC_DEFAULT_LANG || 'zh-CN',
      // 默认租户 ID（从 .env 读取，空则请求时不自动注入）
      X_TENANT_ID: process.env.NUXT_PUBLIC_X_TENANT_ID || '',
      // 路由菜单模式：frontend / backend / hybrid，默认 frontend
      // frontend — 前端 routes 声明式生成菜单骨架
      // backend  — 后端接口下发菜单
      // hybrid   — 后端菜单为主骨架 + 前端路由补充合并
      ROUTING_MODE: process.env.NUXT_PUBLIC_ROUTING_MODE || 'frontend',
    },
  },

  // css
  css: [
    '~/assets/css/uno-reset.css',
    '~/assets/scss/index.scss'
  ],

  // vueuse
  vueuse: {
    ssrHandlers: true,
  },

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    // when using generate, payload js assets included in sw precache manifest
    // but missing on offline, disabling extraction it until fixed
    payloadExtraction: false,
    renderJsonPayloads: true,
    typedPages: true,
  },

  compatibilityDate: '2024-08-14',

  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    prerender: {
      crawlLinks: false,
      // 不预渲染任何路由：预渲染会把构建期数据固化进首页 HTML，
      // 导致「根路由永远正常、其他路由依赖运行时 SSR」的渲染不一致假象，
      // 且首页数据陈旧。所有路由统一运行时 SSR + 客户端自愈。
      routes: [],
      ignore: ['/hi'],
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/scss/element/index.scss" as element;`
        },
      },
    },
    server: {
      // 排除插件部署目录（与 admin 的 vite watch.ignored 同约定）：
      // 插件模板是安装器部署产物，watcher 持句柄会让在线安装/卸载的目录复制与整目录改名失败
      watch: {
        // ignored: ['**/src/plugin/**'],
      },
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8500",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
        },
        "/upload": {
          target: "http://127.0.0.1:8500",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/upload/, "/upload"),
        },
      },
    },
    optimizeDeps: {
      include: ['@wangeditor/editor', '@wangeditor/editor-for-vue'],
    },
  },

  elementPlus: {
    icon: 'ElIcon',
    importStyle: 'scss',
    themes: ['dark'],
  },
})
