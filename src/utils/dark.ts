import { useCookie } from 'nuxt/app'
import { ISDARK } from '~/stores/constant/keys'

export function getDark() {
  try {
    const dark = useCookie(ISDARK)
    return dark.value && parseInt(dark.value) ? true : false
  } catch (error) {
    // 在 SSR 环境中可能会出错，返回默认值 false
    return false
  }
}

export function setDark(val: boolean) {
  try {
    const dark = useCookie(ISDARK)
    dark.value = val ? '1' : '0'
    updateHtmlDarkClass(val)
  } catch (error) {
    // 在 SSR 环境中可能会出错，忽略
  }
}

export function updateHtmlDarkClass(val: boolean) {
  if (import.meta.server) return
  try {
    const htmlEl = document.getElementsByTagName('html')[0]
    // 使用 classList.toggle 避免覆盖其他 class
    if (val) {
      htmlEl.classList.add('dark')
    } else {
      htmlEl.classList.remove('dark')
    }
  } catch (error) {
    // 忽略错误
  }
}

export function initDark() {
  try {
    const isDark = getDark()
    updateHtmlDarkClass(isDark)
    return isDark
  } catch (error) {
    // 在 SSR 环境中可能会出错，返回默认值 false
    return false
  }
}

