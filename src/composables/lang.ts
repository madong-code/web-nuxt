import { useRoute } from 'vue-router'

export function t(message: string) {
    const nuxtApp: any = useNuxtApp()
    const i18nInstance = nuxtApp.$getI18n()
    
    // 直接使用 i18n 的 t 方法，让它自动根据 locale 选择对应的翻译
    return i18nInstance.global.t(message)
}
