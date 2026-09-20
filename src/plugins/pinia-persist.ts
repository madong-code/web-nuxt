import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { initDark } from '~/utils/dark'
import { initTheme } from '~/utils/theme'

export default defineNuxtPlugin(({ $pinia }) => {
    // 仅在客户端使用持久化插件
    if (import.meta.client) {
        // @ts-ignore
        $pinia.use(piniaPluginPersistedstate)
        initDark()
        // 尽早恢复主题色，避免页面闪烁默认蓝
        initTheme()
    }
})
