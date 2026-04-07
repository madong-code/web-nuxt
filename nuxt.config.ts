// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
import path from 'path'

export default defineNuxtConfig({
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
    }
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
          target: "http://127.0.0.1:8001",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
        },
        "/upload": {
          target: "http://127.0.0.1:8001",
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
  ssr: true,
})
