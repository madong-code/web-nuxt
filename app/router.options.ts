import type { RouterConfig } from '@nuxt/schema'
import routes from '~/pages/routes'

// 定义 pluginRoutes 的类型
interface PluginRouteModule {
  default: any[]
}

type PluginRoutes = Record<string, PluginRouteModule>

// import.meta.glob 自动加载模块路由
const pluginRoutes: PluginRoutes = import.meta.glob('@/features/**/pages/routes.ts', { 
  eager: true 
})

// 创建可修改的路由数组副本
const finalRoutes = [...routes]

// 安全地处理 pluginRoutes
if (pluginRoutes && Object.keys(pluginRoutes).length > 0) {
  for (const key in pluginRoutes) {
    const addonModule = pluginRoutes[key]
    
    // 安全检查：确保模块存在且有 default 属性
    if (addonModule?.default && Array.isArray(addonModule.default)) {
      const addon = key.split('/')[2]
      
      // 先加载插件路由后加载app路由
      const processedRoutes = addonModule.default.map((item: any) => {
        item.meta = item.meta ? Object.assign(item.meta, { addon }) : { addon }
        return item
      })
      
      finalRoutes.unshift(...processedRoutes)
    }
  }
}

// https://router.vuejs.org/api/interfaces/routeroptions.html
export default <RouterConfig>{
  routes: (_routes) => finalRoutes,
  strict: false
}