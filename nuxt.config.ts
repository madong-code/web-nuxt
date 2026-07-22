// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
import path from 'path'
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

export default defineNuxtConfig({
  // 启用 src/ 目录布局（Nuxt 4 推荐）
  srcDir: 'src',

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
    public: {
      API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
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
      routes: ['/'],
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
  ssr: false,
})
