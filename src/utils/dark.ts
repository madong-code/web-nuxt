import { useCookie } from 'nuxt/app'
import { ISDARK } from '~/stores/constant/keys'
import { applyThemeColor, getThemeColor } from '~/utils/theme'

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
    // 亮/暗外观下主题色色阶混合底色不同，切换后需重新注入
    applyThemeColor(getThemeColor())
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

/**
 * 带「圆形揭示」过渡的主题切换。
 * 点击时以鼠标坐标为圆心，新主题通过 clip-path 圆形从点击点逐步铺满全屏。
 * 暗黑↔高亮两个方向共用同一逻辑，天然实现反向铺开。
 *
 * 降级：
 *  - 浏览器不支持 View Transitions API → 直接切换（功能无损）
 *  - 用户开启「减少动态效果」偏好 → 跳过动画直接切换
 *
 * @param event 点击/指针事件，用于取圆心坐标
 */
export async function toggleDarkWithTransition(event?: MouseEvent) {
  const next = !getDark()

  // SSR 或无 document 环境，直接切换
  if (import.meta.server || typeof document === 'undefined') {
    setDark(next)
    return
  }

  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { ready: Promise<void> }
  }

  // 是否开启了「减少动态效果」系统偏好
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // 不支持 View Transitions API 或需减少动效 → 直接切换
  if (typeof doc.startViewTransition !== 'function' || reduceMotion) {
    setDark(next)
    return
  }

  // 圆心：优先取点击坐标，否则取屏幕中心
  const x = event?.clientX ?? window.innerWidth / 2
  const y = event?.clientY ?? window.innerHeight / 2

  // 覆盖四角所需的最大半径
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const transition = doc.startViewTransition(() => {
    setDark(next)
  })

  try {
    await transition.ready

    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`
    ]

    document.documentElement.animate(
      { clipPath },
      {
        duration: 520,
        easing: 'ease-in-out',
        // 始终对「新主题」快照做扩散
        pseudoElement: '::view-transition-new(root)'
      }
    )
  } catch (error) {
    // 动画失败不影响主题已切换的结果
  }
}


