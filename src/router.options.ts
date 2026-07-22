import type { RouterConfig } from '@nuxt/schema'
import { collectRoutes } from '~/router/routes-collector'

// 统一收集主应用路由 + 插件路由（含 addon 注入）
const finalRoutes = collectRoutes()

// https://router.vuejs.org/api/interfaces/routeroptions.html
export default <RouterConfig>{
  routes: (_routes) => finalRoutes,
  strict: false,
}
