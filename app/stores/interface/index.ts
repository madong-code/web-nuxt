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
    meta: MenuMeta
    children?: Menus[]
    sort?: number
    belong?: string
    belong_id?: number
    permissions?: string[]
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
