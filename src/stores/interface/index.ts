export interface Globals {
    lazy: NodeJS.Timeout | null
    unique: Ref<number>
    loadLangHandle: Record<string, any>
}

export enum MenuType {
    DIRECTORY = 'directory',
    PAGE = 'page',
    LINK = 'link',
    IFRAME = 'iframe'
}

export enum MenuDisplayType {
    TAB = 'tab',
    LINK = 'link',
    IFRAME = 'iframe'
}

export enum LinkTarget {
    SELF = '_self',
    BLANK = '_blank',
    PARENT = '_parent',
    TOP = '_top'
}

/** 路由菜单模式：前端（routes 声明式生成）/ 后端（接口下发）/ hybrid（后端为主+前端补充） */
export type RoutingMode = 'frontend' | 'backend' | 'hybrid'

/** PC 导航溢出配置：固定显示的一级菜单数量，超出部分收纳到"更多" */
export interface NavOverflowConfig {
  maxVisibleItems: number
}

/**
 * 路由元信息中用于「前端路由菜单模式」的声明式菜单字段。
 *
 * 约定：menu / is_public 默认为 true，只有需要排除时才显式定义 false。
 *   - menu: true（默认）→ 进菜单，menu: false → 不进菜单
 *   - is_public: true（默认）→ 公开可访问，is_public: false → 需登录/权限
 */
export interface RouteMenuMeta {
    /** 是否注册为菜单项（默认 true，不进菜单时设 false） */
    menu?: boolean
    /** 菜单显示名（缺省用 title） */
    menuTitle?: string
    /** Iconify 图标名，如 mdi:forum */
    icon?: string
    /** 排序权重，越小越靠前 */
    order?: number
    /** 权限码（如 portal:ask:publish），用于后端权限校验与菜单导出 */
    code?: string
    /** 所需权限码（字符串或数组，支持 * 通配） */
    permission?: string | string[]
    /** 是否公开可访问（默认 true，需登录/权限时设 false） */
    is_public?: boolean
    /** is_public=false 时是否跳过权限码校验（仅需登录）：true=跳过权限校验 */
    is_no_auth?: boolean
    /** 父菜单路由 path，用于前端模式多级菜单（父节点不存在时自动生成 directory 父节点） */
    parent?: string
    /** 自动生成父节点时的显示标题 */
    parentTitle?: string
    /** 1=导航菜单 2=会员菜单 3=头部动作菜单（导航栏右侧，如消息铃铛） */
    category?: '1' | '2' | '3'
    /** 不进菜单但路由可用 */
    hidden?: boolean
    /** 菜单类型：directory（目录）/ page（内部页）/ link（外链） */
    menuType?: 'directory' | 'page' | 'link'
    [key: string]: any
}

export interface MenuMeta {
    type: MenuType
    target?: LinkTarget
    hidden?: boolean
    disabled?: boolean
    badge?: string | number
    [key: string]: any
}

export interface Menus {
    id: string
    name: string
    type: MenuType
    path?: string
    title: string
    url?: string
    icon?: string
    meta?: MenuMeta
    extra?: Record<string, any>
    children?: Menus[]
    sort?: number
    belong?: string
    belong_id?: number
    permissions?: string[]
    [key: string]: any
}

/**
 * 头部动作菜单（category='3'）配置。
 *
 * 用于「导航栏右侧扩展入口」：默认不预置任何项，由路由 meta 声明或外部插件
 * 通过 systemStore.registerHeaderAction 注册/重写。支持徽章计数、是否登录显示、
 * 跳转路由/外链，以及自定义点击回调（如展开消息面板）。
 */
export interface HeaderActionConfig {
    /** 唯一标识（建议用路由 path，如 /notify），外部更新以该值匹配 */
    id?: string
    /** 显示名 / tooltip */
    title: string
    /** Iconify 图标名，如 mdi:bell */
    icon?: string
    /** 跳转路由 path（内部页） */
    path?: string
    /** 外链 url（与 path 二选一，优先 path） */
    url?: string
    /** 窗口打开方式：_self(默认) / _blank */
    target?: LinkTarget
    /** 排序权重，越小越靠前 */
    order?: number
    /** 是否公开可访问（默认 true；false 表示需登录后才显示） */
    is_public?: boolean
    /** 权限码（is_public=false 时用于登录后的权限校验） */
    permission?: string | string[]
    /** is_public=false 时是否跳过权限码校验（仅需登录）：true=跳过 */
    is_no_auth?: boolean
    /** 初始徽章计数 */
    badge?: string | number
    /** 自定义点击回调：存在时点击优先执行该回调（如展开面板），不再自动跳转 */
    onClick?: () => void | Promise<void>
    /** 点击时携带的额外参数 */
    [key: string]: any
}

export interface SiteConfig {
    site_name: string
    record_number?: string
    version: string
    upload: {
        mode: string
        [key: string]: any
    }
    head_nav: Menus[]
    initialize: boolean
    user_initialize: boolean
}

export interface Member {
    id: number|string
    username: string
    nickname: string
    email: string
    mobile: string
    gender: number
    birthday: string
    money: number
    score: number
    avatar: string
    last_login_time: string
    last_login_ip: string
    motto: string
    token: string
    refresh_token: string
}

export interface PersonalCenter {
    open: boolean
    user_menus: Menus[]
    show_headline: boolean
    auth_node: Map<string, string[]>
    shrink: boolean
    menu_expand: boolean
    nav_user_menus: Menus[]
}
