import { useCookie } from 'nuxt/app'
import { THEME_COLOR } from '~/stores/constant/keys'

/**
 * 主题色支持：预设色 + cookie 持久化 + CSS 变量注入。
 * 通过覆写 --el-color-primary 及派生色阶实现全站换色，
 * 亮/暗两种外观下分别按 Element Plus 公式混合背景色生成色阶。
 */

// 预设主题色（与主题面板色块一致，第一个为站点编译期默认主色，选中即恢复默认）
export const THEME_PRESETS = [
    { name: '靛蓝', color: '#6366f1' },
    { name: '翡翠绿', color: '#10b981' },
    { name: '优雅紫', color: '#8b5cf6' },
    { name: '活力橙', color: '#f59e0b' },
    { name: '青碧色', color: '#14b8a6' },
]

/** 读取已保存的主题色（空串表示使用默认蓝） */
export function getThemeColor(): string {
    try {
        const theme = useCookie(THEME_COLOR)
        return theme.value || ''
    } catch (error) {
        return ''
    }
}

/** 保存主题色到 cookie 并立即应用 */
export function setThemeColor(color: string) {
    try {
        const theme = useCookie(THEME_COLOR)
        theme.value = color
    } catch (error) {
        // SSR 环境忽略
    }
    applyThemeColor(color)
}

/** 把 color1 与 color2 按 weight（color1 占比 0~1）混合，返回 hex */
function mixColor(color1: string, color2: string, weight: number): string {
    const parse = (c: string): [number, number, number] => {
        let hex = c.replace('#', '')
        if (hex.length === 3) hex = hex.split('').map((ch) => ch + ch).join('')
        const num = parseInt(hex, 16)
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
    }
    const [r1, g1, b1] = parse(color1)
    const [r2, g2, b2] = parse(color2)
    const w = Math.min(Math.max(weight, 0), 1)
    const mix = (a: number, b: number) => Math.round(a * w + b * (1 - w))
    return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)]
        .map((v) => v.toString(16).padStart(2, '0'))
        .join('')}`
}

/**
 * 将主题色注入 html 根元素的 CSS 变量（内联样式优先级最高，
 * 可覆盖 Element Plus 默认变量及暗黑主题的 html.dark 变量）。
 * @param color 目标色值，为空时跳过
 */
export function applyThemeColor(color?: string) {
    if (import.meta.server || typeof document === 'undefined' || !color) return
    const htmlEl = document.documentElement
    // 暗黑外观下 light-x 色阶与 #141414 混合（与 Element Plus 暗黑主题公式一致）
    const dark = htmlEl.classList.contains('dark')
    const bg = dark ? '#141414' : '#ffffff'
    const style = htmlEl.style
    style.setProperty('--el-color-primary', color)
    // dark-2：混入 20% 黑
    style.setProperty('--el-color-primary-dark-2', mixColor(color, '#000000', 0.8))
    // light-3/5/7/8/9：向背景色方向逐级减淡
    for (const i of [3, 5, 7, 8, 9]) {
        style.setProperty(`--el-color-primary-light-${i}`, mixColor(color, bg, 1 - i / 10))
    }
}

/** 应用初始化：恢复 cookie 中保存的主题色 */
export function initTheme() {
    const color = getThemeColor()
    if (color) applyThemeColor(color)
}
