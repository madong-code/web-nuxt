/**
 * 前端路由菜单模式 —— 菜单骨架构建器 + 混合合并器
 *
 * 把「主应用路由 + 插件路由」转换为统一菜单树（Menus[]），供 systemStore 收敛为
 * nav_menu / member_menu。与后端模式产出同一结构，菜单组件无需改动。
 *
 * 规则：
 *   - 仅 meta.menu === true 且 !meta.hidden 的路由进菜单
 *   - 按 meta.parent（父路由 path）递归组树；父节点不存在时自动生成 directory 父节点
 *   - 按 meta.order 排序
 *   - 按 meta.category 拆分为 nav(1) / member(2)
 *   - 含 :param 的路由保留占位 path（如 /page/:code），由后端可见性配置决定具体填充
 *
 * 新增 mergeMenus()：hybrid 模式下以后端菜单为主、前端菜单为补充进行合并
 */
import type { Menus } from '~/stores/interface'
import { MenuType, LinkTarget } from '~/stores/interface'
import { registerMenuDialog } from '~/composables/menu-dialog'

export interface FrontendMenuResult {
  nav: Menus[]
  member: Menus[]
  /** 头部动作菜单（category='3'）：导航栏右侧扩展入口，如消息铃铛 */
  headerActions: Menus[]
}

function normalizePermission(perm: string | string[] | undefined): string[] {
  if (!perm) return []
  if (Array.isArray(perm)) return perm
  return String(perm).split(',').map(p => p.trim()).filter(Boolean)
}

export function buildFrontendMenu(routes: any[]): FrontendMenuResult {
  const map = new Map<string, Menus>()
  const roots: Menus[] = []

  // 第一遍：生成菜单节点
  routes.forEach((route: any) => {
    const meta: Record<string, any> = route.meta || {}
    // menu 默认 true，只有显式设为 false 才排除
    if (meta.menu === false || meta.hidden === true) return

    const title = meta.menuTitle || meta.title || ''
    const id = route.path
    const permissions = normalizePermission(meta.permission)
    const code = meta.code || ''

    const menu: Menus = {
      id,
      name: title,
      type: (meta.menuType as MenuType) || MenuType.PAGE,
      path: route.path,
      title,
      url: route.path,
      icon: meta.icon || '',
      sort: meta.order ?? 0,
      permissions,
      code,
      meta: {
        type: (meta.menuType as MenuType) || MenuType.PAGE,
        target: LinkTarget.SELF,
        // 保留原始 is_public 值（供权限检查用）+ 兼容旧 public 字段
        is_public: meta.is_public,
        public: meta.is_public !== false,
        permissions,
        code,
        ...meta,
      },
      extra: meta.extra || {},
      children: [],
    }

    map.set(route.path, menu)

    // dialog 类型：将 route.component 注册到弹窗组件表
    if (meta.menuType === 'dialog' && typeof route.component === 'function') {
      registerMenuDialog(route.path, route.component, { title, icon: meta.icon })
    }
  })

  // 第二遍：组树（支持 meta.parent 多级）
  map.forEach((menu) => {
    const parentPath = menu.meta?.parent as string | undefined
    if (parentPath) {
      let parent = map.get(parentPath)
      if (!parent) {
        // 父节点不存在时自动生成 directory 父节点
        const parentTitle = (menu.meta?.parentTitle as string) || parentPath
        const category = menu.meta?.category
        parent = {
          id: parentPath,
          name: parentTitle,
          type: MenuType.DIRECTORY,
          path: parentPath,
          title: parentTitle,
          url: parentPath,
          icon: ({ '/member/community': 'mdi:account-group', '/member/account': 'mdi:cog-outline' } as Record<string, string>)[parentPath] || '',
          sort: menu.sort ?? 0,
          meta: {
            type: MenuType.DIRECTORY,
            target: LinkTarget.SELF,
            category,
            // 父目录默认公开
            public: true,
          },
          extra: {},
          children: [],
        }
        map.set(parentPath, parent)
      }
      if (!parent.children) parent.children = []
      parent.children.push(menu)
    } else {
      roots.push(menu)
    }
  })

  // 第三遍：递归排序
  const sortTree = (list: Menus[]): Menus[] =>
    list
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((m) => {
        if (m.children?.length) m.children = sortTree(m.children)
        return m
      })

  const sortedRoots = sortTree(roots)

  // 第四遍：按 category 拆分为 nav / member / headerActions
  const nav: Menus[] = []
  const member: Menus[] = []
  const headerActions: Menus[] = []
  sortedRoots.forEach((m) => {
    const cat = m.meta?.category as string | undefined
    if (cat === '2') member.push(m)
    else if (cat === '3') headerActions.push(m)
    else nav.push(m)
  })

  return { nav, member, headerActions }
}

/**
 * 混合模式(hybrid) —— 菜单合并器
 *
 * 以后端菜单为主骨架，前端菜单作为补充填充后端未覆盖的菜单项。
 * 合并规则：
 *   1. 后端菜单为基准，保留后端排序
 *   2. 前端独有的顶级菜单（按 path 去重）追加到末尾
 *   3. 同级已存在的菜单（path 相同），子菜单也做 path 去重合并（后端优先，前端补充子项）
 *   4. 前端补充项按 sort 排在同级末尾
 *
 * @param backendNav     后端导航菜单树
 * @param backendMember  后端会员菜单树
 * @param frontendNav    前端导航菜单树
 * @param frontendMember 前端会员菜单树
 * @param backendHeaderActions  后端头部动作菜单树（category='3'）
 * @param frontendHeaderActions 前端头部动作菜单树（category='3'）
 */
export interface MergeMenuResult {
  nav: Menus[]
  member: Menus[]
  /** 头部动作菜单（category='3'）合并结果 */
  headerActions: Menus[]
}

export function mergeMenus(
  backendNav: Menus[],
  backendMember: Menus[],
  frontendNav: Menus[],
  frontendMember: Menus[],
  backendHeaderActions: Menus[] = [],
  frontendHeaderActions: Menus[] = [],
): MergeMenuResult {
  return {
    nav: mergeMenuTrees(backendNav, frontendNav),
    member: mergeMenuTrees(backendMember, frontendMember),
    headerActions: mergeMenuTrees(backendHeaderActions, frontendHeaderActions),
  }
}

/**
 * 收集菜单树中所有节点的 path/url，用于全局去重（含嵌套子节点）
 */
function collectAllPaths(menus: Menus[], set: Set<string> = new Set()): Set<string> {
  for (const m of menus) {
    const p = m.path || m.url || ''
    if (p) set.add(p)
    if (m.children?.length) collectAllPaths(m.children, set)
  }
  return set
}

/**
 * 合并两组同类型菜单树（如 nav 或 member）。
 * 后端优先，前端作为补充，按 path 全局去重，避免会员菜单等出现重复项。
 *
 * 处理两类常见不一致（混合模式下后端与前端对菜单的归组结构可能不同）：
 *  - 后端/前端对同一菜单使用相同 path：合并子菜单，不重复添加。
 *  - 后端为扁平结构、前端生成了“合成父目录”（如账户设置/我的社区）来归组后端已有的子项：
 *    直接追加整个合成父目录会让子项重复，因此裁剪掉后端已存在的子孙，
 *    仅当合成父目录仍含后端没有的子项时才保留。
 */
function mergeMenuTrees(backendMenus: Menus[], frontendMenus: Menus[]): Menus[] {
  // 后端全树 path 集合（含嵌套），用于全局去重
  const backendPaths = collectAllPaths(backendMenus)
  const result: Menus[] = backendMenus.map(m => cloneMenu(m))

  const mergeInto = (backendList: Menus[], frontendList: Menus[]): Menus[] => {
    // 当前层 path → index 映射（仅用于“同层同 path 合并子菜单”）
    const backendIdxByPath = new Map<string, number>()
    backendList.forEach((m, i) => {
      const p = m.path || m.url || ''
      if (p) backendIdxByPath.set(p, i)
    })

    for (const fe of frontendList) {
      const fePath = fe.path || fe.url || ''
      const idx = fePath ? backendIdxByPath.get(fePath) : undefined

      if (idx !== undefined) {
        // 后端同层已有同 path 节点：递归合并子菜单（后端优先、前端补充去重）
        const existing = backendList[idx]
        if (existing && fe.children?.length) {
          existing.children = mergeInto(existing.children || [], fe.children)
        }
      } else if (fePath && !backendPaths.has(fePath)) {
        // 后端树任意层级均无该 path：前端独有项，裁剪掉后端已存在的子孙后追加
        const pruned = pruneFrontendNode(fe, backendPaths)
        if (pruned) {
          collectAllPaths([pruned], backendPaths)
          backendList.push(pruned)
          backendIdxByPath.set(fePath, backendList.length - 1)
        }
      }
      // 其余情况（fePath 已在后端树某处存在，但不在当前层）：跳过，避免重复
    }

    return backendList.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  }

  return mergeInto(result, frontendMenus)
}

/**
 * 克隆前端节点并裁剪掉后端已存在的子孙节点。
 * 返回 null 表示该节点对后端无任何新增贡献（如仅用于归组后端已有子项的空目录）。
 */
function pruneFrontendNode(node: Menus, backendPaths: Set<string>): Menus | null {
  const path = node.path || node.url || ''
  if (path && backendPaths.has(path)) return null

  const cloned = cloneMenu(node)
  if (cloned.children?.length) {
    const kept: Menus[] = []
    for (const child of cloned.children) {
      const p = pruneFrontendNode(child, backendPaths)
      if (p) kept.push(p)
    }
    cloned.children = kept
  }

  // 裁剪后已无子节点且本身为目录（合成父目录）：丢弃，避免空壳/重复
  if ((!cloned.children || cloned.children.length === 0) && cloned.type === MenuType.DIRECTORY) {
    return null
  }
  return cloned
}

/**
 * 深拷贝单个菜单节点（浅拷贝 children 数组）
 */
function cloneMenu(menu: Menus): Menus {
  return {
    ...menu,
    meta: menu.meta ? { ...menu.meta } : undefined,
    extra: menu.extra ? { ...menu.extra } : undefined,
    children: menu.children
      ? menu.children.map(child => cloneMenu(child))
      : menu.children,
  }
}
