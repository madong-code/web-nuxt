import { useRoute } from 'vue-router'
import Language from '~/utils/language'

export function t(message: string) {
    const i18n = useNuxtApp().$getI18n()
    const route = useRoute()
    const file = new Language(i18n).getFileKey((route?.meta.plugin || 'app'), route?.path || '')
    const key = `${file}.${message}`
    return i18n.global.t(key) != key ? i18n.global.t(key) : i18n.global.t(message)
}
