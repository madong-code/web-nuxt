import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { initDark } from '~/utils/dark'

export default defineNuxtPlugin(({ $pinia }) => {
    // 仅在客户端使用持久化插件
    if (import.meta.client) {
        // @ts-ignore
        $pinia.use(piniaPluginPersistedstate)
        initDark()
    }
})
