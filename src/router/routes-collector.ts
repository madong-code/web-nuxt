/**
 * 共享路由收集器
 *
 * 把 router.options.ts 中「主应用路由 + 插件路由」的 glob 扫描与 addon 注入逻辑
 * 下沉到独立模块，供两处复用：
 *   1. router.options.ts        —— 路由注册（vue-router）
 *   2. utils/menu-builder.ts    —— 前端路由菜单模式生成菜单骨架
 * 避免重复扫描与两套不一致。
 *
 * 新增 flattenNestedRoutes()：将 children 嵌套路由定义展平为扁平数组，
 * 与当前 meta.parent 扁平风格统一，menu-builder 无需改动。
 */
import routes from '~/pages/routes'

interface PluginRouteModule {
  default: any[]
}

type PluginRoutes = Record<string, PluginRouteModule>

// import.meta.glob 自动加载模块路由
const pluginRoutes: PluginRoutes = import.meta.glob('~/plugin/**/pages/routes.ts', {
  eager: true,
})

/**
 * 将 children 嵌套路由定义展平为扁平数组。
 *
 * 展平规则：
 *   - 遍历路由数组，遇到 children 字段时递归展平
 *   - 子路由的相对 path（如 'sponsor'）拼接为绝对 path（如 '/community/sponsor'）
 *   - 展平后的子路由注入 meta.parent / meta.parentTitle / meta.category 继承父级
 *   - 父级路由本身保留在扁平数组中（供 menu-builder 消费）
 *   - 两种风格（扁平 meta.parent + 嵌套 children）可并存
 *
 * @param routes          原始路由数组（可能含 children）
 * @param parentPath      递归调用时的父级绝对 path（顶层为空）
 * @param parentMeta      递归调用时的父级 meta（顶层为空）
 */
export function flattenNestedRoutes(
  routes: any[],
  parentPath?: string,
  parentMeta?: Record<string, any>,
): any[] {
  const result: any[] = []

  for (const route of routes) {
    const rawPath = route.path || ''
    // 拼接绝对 path：子路由相对 path + 父级 path
    const absolutePath = resolveAbsolutePath(rawPath, parentPath)
    const meta = route.meta ? { ...route.meta } : {}

    // 继承父级 meta 属性（子级未指定时）
    if (parentMeta) {
      // parent：指向父级绝对 path
      if (!meta.parent) {
        meta.parent = parentPath!
      }
      // parentTitle：继承父级 title
      if (!meta.parentTitle && parentMeta.title) {
        meta.parentTitle = parentMeta.title
      }
      // category：继承父级 category
      if (!meta.category && parentMeta.category) {
        meta.category = parentMeta.category
      }
      // is_public：继承父级 is_public（子级未指定时）
      if (meta.is_public === undefined && parentMeta.is_public !== undefined) {
        meta.is_public = parentMeta.is_public
      }
    }

    // menu 默认 true：未指定 menu 时视为进菜单（只有显式 false 才排除）
    if (meta.menu === undefined && meta.hidden !== true) {
      meta.menu = true
    }

    // 构建展平后的路由项（不含 children）
    const flatRoute: any = {
      ...route,
      path: absolutePath,
      meta,
    }
    // 移除 children，避免后续重复处理
    delete flatRoute.children

    result.push(flatRoute)

    // 递归展平 children
    if (route.children && Array.isArray(route.children) && route.children.length > 0) {
      const childFlat = flattenNestedRoutes(route.children, absolutePath, meta)
      result.push(...childFlat)
    }
  }

  return result
}

/**
 * 拼接绝对路径。
 * - 父级为空时直接返回 rawPath（顶级路由）
 * - rawPath 以 '/' 开头时视为绝对路径，直接返回
 * - 否则拼接父级 path + '/' + rawPath
 */
function resolveAbsolutePath(rawPath: string, parentPath?: string): string {
  if (!parentPath) return rawPath
  if (rawPath.startsWith('/')) return rawPath
  // 去除父级尾部斜杠，避免重复
  const base = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath
  return `${base}/${rawPath}`
}

/**
 * 收集主应用路由 + 所有插件路由，并注入插件标识 addon。
 * 展平所有 children 嵌套定义后返回扁平数组。
 */
export function collectRoutes(): any[] {
  const finalRoutes = [...routes]

  if (pluginRoutes && Object.keys(pluginRoutes).length > 0) {
    for (const key in pluginRoutes) {
      const addonModule = pluginRoutes[key]

      // 安全检查：确保模块存在且有 default 属性
      if (addonModule?.default && Array.isArray(addonModule.default)) {
        const addon = key.split('/')[2]

        // 先加载插件路由后加载 app 路由
        const processedRoutes = addonModule.default.map((item: any) => {
          item.meta = item.meta ? Object.assign(item.meta, { addon }) : { addon }
          return item
        })

        finalRoutes.unshift(...processedRoutes)
      }
    }
  }

  // 展平所有 children 嵌套路由定义
  return flattenNestedRoutes(finalRoutes)
}
