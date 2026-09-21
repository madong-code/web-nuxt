export function t(message: string, ...args: any[]) {
    const nuxtApp: any = useNuxtApp()
    const i18nInstance = nuxtApp.$getI18n()

    // 直接使用 i18n 的 t 方法，让它自动根据 locale 选择对应的翻译
    // 透传插值参数等额外实参（如 t('key', { email })）
    return (i18nInstance.global.t as any)(message, ...args)
}
