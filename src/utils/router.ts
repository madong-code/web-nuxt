import type { RouteRecordRaw } from 'vue-router'
import type { Menus } from '~/stores/interface'

/**
 * 获取第一个菜单
 */
export const getFirstRoute = (routes: RouteRecordRaw[]): false | RouteRecordRaw => {
    const routerPaths: string[] = []
    const router = useRouter()
    const routers = router.getRoutes()
    routers.forEach((item) => {
        if (item.path) routerPaths.push(item.path)
    })
    let find: boolean | RouteRecordRaw = false
    for (const key in routes) {
        if (routes[key].meta?.type != 'menu_dir' && routerPaths.indexOf(routes[key].path) !== -1) {
            return routes[key]
        } else if (routes[key].children && routes[key].children?.length) {
            find = getFirstRoute(routes[key].children!)
            if (find) return find
        }
    }
    return find
}

/**
 * 打开菜单
 * @param menu 菜单数据
 */
export const onClickMenu = (menu: RouteRecordRaw) => {
    switch (menu.meta?.menu_type) {
        case 'iframe':
        case 'tab':
            navigateTo(menu.path)
            break
        case 'link':
            window.open(menu.path, '_blank')
            break

        default:
            alert('菜单类型未识别')
            // ElNotification({
            //     message: $t('utils.Navigation failed, the menu type is unrecognized!'),
            //     type: 'error',
            // })
            break
    }
}

/**
 * 处理权限节点
 * @param routes 路由数据
 * @param prefix 节点前缀
 * @returns 组装好的权限节点
 */
export const handleAuthNode = (routes: any, prefix = '/') => {
    const authNode: Map<string, string[]> = new Map([])
    assembleAuthNode(routes, authNode, prefix, prefix)
    return authNode
}
const assembleAuthNode = (routes: any, authNode: Map<string, string[]>, prefix = '/', parent = '/') => {
    const authNodeTemp = []
    for (const key in routes) {
        if (routes[key].type == 'button') authNodeTemp.push(prefix + routes[key].name)
        if (routes[key].children && routes[key].children.length > 0) {
            assembleAuthNode(routes[key].children, authNode, prefix, prefix + routes[key].name)
        }
    }
    if (authNodeTemp && authNodeTemp.length > 0) {
        authNode.set(parent, authNodeTemp)
    }
}

export const registerMenus = (rules: any, menus: any) => {
    const systemConfig = useSystemStore()
    // if (rules.length) {
    //     personalCenter.mergeAuthNode(handleAuthNode(rules, '/'))
    //     systemConfig.setHeadNav(handleMenus(rules, '/', ['nav']))
    //     personalCenter.mergeNavUserMenus(handleMenus(rules, '/', ['nav_user_menu']))
    // }
    // if (menus.length) {
    //     const menupersonalCenterBaseRoute = '/user/'
    //     personalCenter.mergeAuthNode(handleAuthNode(menus, menupersonalCenterBaseRoute))

    //     personalCenter.mergeNavUserMenus(handleMenus(menus, '/', ['nav_user_menu']))
    //     personalCenter.setShowHeadline(menus.length > 1)
    //     personalCenter.setUserMenus(handleMenus(menus, menupersonalCenterBaseRoute, ['menu', 'menu_dir']))
    // }
}

export const handleMenus = (rules: any, prefix = '/', type = ['nav']) => {
    const menus: Menus[] = []
    for (const key in rules) {
        if (rules[key].extend == 'add_rules_only') {
            continue
        }
        if (rules[key].type == 'menu_dir' && rules[key].children && !rules[key].children.length) {
            continue
        }
        let children: Menus[] = []
        if (rules[key].children && rules[key].children.length > 0) {
            children = handleMenus(rules[key].children, prefix, type)
        }

        if (type.includes(rules[key].type)) {
            let path = ''
            if (['link', 'iframe'].includes(rules[key].menu_type)) {
                path = rules[key].url
            } else {
                path = prefix + rules[key].path
            }
            menus.push({
                ...rules[key],
                meta: {
                    /**
                     * 在 meta 中存储多个可能用到的属性
                     * 兼容 RouteRecordRaw 和 RouteLocationNormalizedLoaded 类型
                     */
                    id: rules[key].id,
                    type: rules[key].type,
                    menu_type: rules[key].menu_type,
                },
                path: path,
                children: children,
            })
        }
    }
    return menus
}
