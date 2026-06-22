// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
import path from 'path'

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
    baseURL: '/web',
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
      X_TENANT_ID: process.env.NUXT_PUBLIC_X_TENANT_ID || '',
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
