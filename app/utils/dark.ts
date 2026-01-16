import { ISDARK } from '~/stores/constant/keys'

export function getDark() {
    const dark = useCookie(ISDARK)
    return dark.value && parseInt(dark.value) ? true : false
}

export function setDark(val: boolean) {
    const dark = useCookie(ISDARK)
    dark.value = val ? '1' : '0'
    updateHtmlDarkClass(val)
}

export function updateHtmlDarkClass(val: boolean) {
    if (import.meta.server) return
    const htmlEl = document.getElementsByTagName('html')[0]
    htmlEl.setAttribute('class', val ? 'dark' : '')
}

export function initDark() {
    updateHtmlDarkClass(getDark())
}

if (import.meta.client) initDark()
