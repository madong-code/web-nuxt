/**
 * SSR 请求层预热（server 专属）
 *
 * Nuxt SSR 渲染中，useAsyncData handler 的深层 await 链可能丢失 Nuxt 实例上下文，
 * 届时请求层 useRuntimeConfig()/useMemberStore() 会抛错，导致 SSR fetch 静默失败、
 * 页面直出空导航/默认站点配置并引发 hydration mismatch。
 *
 * 本插件在每个 SSR 请求渲染早期（插件阶段必有上下文）预热请求层的
 * runtimeConfig 进程级缓存，保证后续脱离上下文的请求仍能取到正确 baseURL。
 */
import { warmRequestRuntimeConfig } from '~/api/request'

export default defineNuxtPlugin(() => {
    warmRequestRuntimeConfig()
})
