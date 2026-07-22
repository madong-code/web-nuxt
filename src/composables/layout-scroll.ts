import { useTemplateRef, watch, provide } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 布局滚动公共逻辑（default / member / blank 三布局复用）
 * - calcHeight(headerHeight)：计算主内容区高度（calc(100vh - headerHeight)）
 * - 路由切换时主滚动条置顶（尊重 route.meta.disableScrollTo）
 * - 将滚动条 ref provide 给子组件（inject('mainScrollbarRef')）
 *
 * 注意：仅封装 <script> 逻辑，布局文件仍保留在 layouts/ 目录，
 * Nuxt 4 按文件名自动注册，不会因调用本 composable 变成手动注册。
 */
export function useLayoutScroll(headerHeight = 60) {
  const route = useRoute()
  const mainScrollbarRef = useTemplateRef('mainScrollbarRef')

  const calcHeight = (h: number = headerHeight) => ({
    height: `calc(100vh - ${h}px)`,
    maxHeight: `calc(100vh - ${h}px)`,
  })

  watch(
    () => route.fullPath,
    () => {
      if (!route.meta.disableScrollTo) {
        mainScrollbarRef.value?.scrollTo(0, 0)
      }
    },
  )

  provide('mainScrollbarRef', mainScrollbarRef)

  return { mainScrollbarRef, calcHeight }
}
