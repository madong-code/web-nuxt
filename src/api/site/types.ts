/**
 * 站点首页模块相关类型定义
 */

/** 友情链接项 */
export interface LinkItem {
    id: number
    name: string
    url: string
    logo?: string
    description?: string
    category?: string
    sort: number
    target?: string
    click_count?: number
    enabled: number
    created_at: number
    updated_at: number
    deleted_at: number | null
}

/** 广告项 */
export interface AdvertisementItem {
    id: number
    title: string
    link: string
    image: string
    description?: string
    sort: number
    enabled: number
    start_time: number
    end_time: number
    created_at: number
    updated_at: number
    deleted_at: number | null
}

/** 搜索配置项 */
export interface SearchConfig {
    keyword: string
    keyword_enabled: number
}

/** 单个菜单项的可见性/权限覆盖（前端路由菜单模式运行期下发） */
export interface MenuVisibilityItem {
    /** 是否可见，false 则从菜单中移除 */
    visible?: boolean
    /** 覆盖后的权限码（字符串或数组） */
    permissions?: string | string[]
    /** 覆盖后是否公开可访问 */
    is_public?: boolean | number
    /** 权限码 */
    code?: string
}

/**
 * 站点导航配置（/site/nav-config，登录态无关整体输出）
 * - routing_mode：覆盖构建期默认模式（frontend/backend/hybrid）
 * - codes：全部菜单权限码集合（backend/hybrid 模式校验非公开路由有效性）
 * - 四类全量树：节点带 is_public（显隐语义，非权限语义），由前端按登录态响应式过滤
 */
export interface NavConfigData {
    routing_mode?: 'frontend' | 'backend' | 'hybrid'
    menu_visibility?: Record<string, MenuVisibilityItem>
    /** PC 导航栏最大显示一级菜单数量（溢出部分收纳到"更多"） */
    max_nav_items?: number
    /** 全部菜单权限码集合 */
    codes?: string[]
    /** 主导航（web_menu category=1 全量树） */
    menus: NavMenuItem[]
    /** 会员菜单（web_menu category=2 全量树，头像下拉数据源） */
    member_menus?: NavMenuItem[]
    /** 头部动作（web_menu category=3 全量树） */
    header_actions?: NavMenuItem[]
    /** 底部菜单（web_menu category=4 全量树） */
    footer_menus?: NavMenuItem[]
}

/** 前台导航菜单项（web 后台菜单管理 md_web_menu，后端组树输出，登录态无关全量下发） */
export interface NavMenuItem {
    name: string
    url: string
    /** 新窗口外链（target=2 或 http(s) 绝对地址） */
    external: boolean
    /** 高亮前缀数组（系统栏目正身联动详情域）；空数组 = 永不高亮 */
    active_prefix: string[]
    /** 菜单图标名（web_menu.icon 原样输出；前台按已知图标映射渲染，未知回退） */
    icon?: string
    /** 显隐语义：true 公开；false 仅登录可见（页面保护由路由 auth 中间件负责） */
    is_public?: boolean
    /** true：登录即可见，无需权限码校验 */
    is_no_auth?: boolean
    /** 权限码（is_public=false 且 is_no_auth=false 时校验） */
    code?: string
    children?: NavMenuItem[]
}

/** 站点全局配置（站点信息 / 页脚版权备案 / 百度统计） */
export interface WebSiteConfig {
    site_name: string
    site_logo: string
    copyright: string
    icp_number: string
    icp_url: string
    police_number: string
    police_url: string
    show_apply: boolean
    show_powered: boolean
    /** 赞助/合作联系邮箱（成为赞助商页展示） */
    contact_email: string
    tongji_enabled: boolean
    tongji_key: string
    /** 会员套餐总开关（默认关闭；关闭后前台隐藏会员开通入口） */
    membership_enabled: boolean
}
