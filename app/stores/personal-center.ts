import { defineStore } from 'pinia'
import type { PersonalCenter, Menus } from '~/stores/interface'





// 顶栏会员菜单下拉项（nav_user_menus）- 动态菜单
const navUserMenus: Menus[] = [
    {
        "id": 101,
        "name": "dashboard",
        "type": "menu",
        "path": "/member/dashboard",
        "title": "仪表盘",
        "url": "",
        "icon": "i-dashboard",
        "meta": {
            "id": 101,
            "type": "menu",
            "menu_type": "tab"
        },
        "children": []
    },
    {
        "id": 102,
        "name": "orders",
        "type": "menu",
        "path": "/member/orders",
        "title": "我的订单",
        "url": "",
        "icon": "i-shopping-cart",
        "meta": {
            "id": 102,
            "type": "menu",
            "menu_type": "tab"
        },
        "children": []
    },
    {
        "id": 103,
        "name": "wallet",
        "type": "menu",
        "path": "/member/wallet",
        "title": "我的钱包",
        "url": "",
        "icon": "i-wallet",
        "meta": {
            "id": 103,
            "type": "menu",
            "menu_type": "tab"
        },
        "children": []
    },
    {
        "id": 104,
        "name": "messages",
        "type": "menu",
        "path": "/member/messages",
        "title": "消息中心",
        "url": "",
        "icon": "i-message",
        "meta": {
            "id": 104,
            "type": "menu",
            "menu_type": "tab"
        },
        "children": []
    }
]

// 会员中心菜单（user_menus）- 完整的会员中心菜单结构
const userMenus: Menus[] = [
    {
        "id": 1,
        "name": "member_center",
        "type": "directory",
        "path": "/member",
        "title": "会员中心",
        "url": "",
        "icon": "i-user",
        "meta": {
            "id": 1,
            "type": "directory",
            "menu_type": "tab"
        },
        "children": [
            {
                "id": 11,
                "name": "profile",
                "type": "menu",
                "path": "/member/profile",
                "title": "个人资料",
                "url": "",
                "icon": "i-profile",
                "meta": {
                    "id": 11,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            },
            {
                "id": 12,
                "name": "security",
                "type": "menu",
                "path": "/member/security",
                "title": "安全设置",
                "url": "",
                "icon": "i-shield",
                "meta": {
                    "id": 12,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            },
            {
                "id": 13,
                "name": "notification",
                "type": "menu",
                "path": "/member/notification",
                "title": "通知设置",
                "url": "",
                "icon": "i-bell",
                "meta": {
                    "id": 13,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            }
        ]
    },
    {
        "id": 2,
        "name": "order_management",
        "type": "directory",
        "path": "/member/orders",
        "title": "订单管理",
        "url": "",
        "icon": "i-shopping-cart",
        "meta": {
            "id": 2,
            "type": "directory",
            "menu_type": "tab"
        },
        "children": [
            {
                "id": 21,
                "name": "order_list",
                "type": "menu",
                "path": "/member/orders/list",
                "title": "订单列表",
                "url": "",
                "icon": "i-list",
                "meta": {
                    "id": 21,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            },
            {
                "id": 22,
                "name": "order_history",
                "type": "menu",
                "path": "/member/orders/history",
                "title": "历史订单",
                "url": "",
                "icon": "i-history",
                "meta": {
                    "id": 22,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            },
            {
                "id": 23,
                "name": "refund_orders",
                "type": "menu",
                "path": "/member/orders/refund",
                "title": "退款订单",
                "url": "",
                "icon": "i-refresh",
                "meta": {
                    "id": 23,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            }
        ]
    },
    {
        "id": 3,
        "name": "finance",
        "type": "directory",
        "path": "/member/finance",
        "title": "财务管理",
        "url": "",
        "icon": "i-wallet",
        "meta": {
            "id": 3,
            "type": "directory",
            "menu_type": "tab"
        },
        "children": [
            {
                "id": 31,
                "name": "balance",
                "type": "menu",
                "path": "/member/finance/balance",
                "title": "账户余额",
                "url": "",
                "icon": "i-money",
                "meta": {
                    "id": 31,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            },
            {
                "id": 32,
                "name": "recharge",
                "type": "menu",
                "path": "/member/finance/recharge",
                "title": "在线充值",
                "url": "",
                "icon": "i-credit-card",
                "meta": {
                    "id": 32,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            },
            {
                "id": 33,
                "name": "transaction",
                "type": "menu",
                "path": "/member/finance/transaction",
                "title": "交易记录",
                "url": "",
                "icon": "i-file-text",
                "meta": {
                    "id": 33,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            }
        ]
    },
    {
        "id": 4,
        "name": "support",
        "type": "directory",
        "path": "/member/support",
        "title": "客服支持",
        "url": "",
        "icon": "i-headphones",
        "meta": {
            "id": 4,
            "type": "directory",
            "menu_type": "tab"
        },
        "children": [
            {
                "id": 41,
                "name": "help_center",
                "type": "menu",
                "path": "/member/support/help",
                "title": "帮助中心",
                "url": "",
                "icon": "i-help-circle",
                "meta": {
                    "id": 41,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            },
            {
                "id": 42,
                "name": "contact_us",
                "type": "menu",
                "path": "/member/support/contact",
                "title": "联系我们",
                "url": "",
                "icon": "i-phone",
                "meta": {
                    "id": 42,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            },
            {
                "id": 43,
                "name": "feedback",
                "type": "menu",
                "path": "/member/support/feedback",
                "title": "意见反馈",
                "url": "",
                "icon": "i-message-square",
                "meta": {
                    "id": 43,
                    "type": "menu",
                    "menu_type": "tab"
                },
                "children": []
            }
        ]
    }
]


export const usePersonalCenterStore = defineStore('personal-center', () => {
    const state: PersonalCenter = reactive({
        open: true,
        user_menus: userMenus,
        show_headline: true,
        auth_node: new Map(),
        shrink: false,
        menu_expand: false,
        nav_user_menus: navUserMenus,
    })

    const setNavUserMenus = (menus: Menus[]) => {
        state.nav_user_menus = menus
    }

    const mergeNavUserMenus = (menus: Menus[]) => {
        state.nav_user_menus = [...state.nav_user_menus, ...menus]
    }

    const setAuthNode = (key: string, data: string[]) => {
        state.auth_node.set(key, data)
    }

    const mergeAuthNode = (authNode: Map<string, string[]>) => {
        state.auth_node = new Map([...state.auth_node, ...authNode])
    }

    const setUserMenus = (menus: Menus[]): void => {
        state.user_menus = encodeRoutesURI(menus)
    }

    const setShowHeadline = (show: boolean): void => {
        state.show_headline = show
    }

    const setShrink = (shrink: boolean) => {
        state.shrink = shrink
    }

    const setStatus = (status: boolean) => {
        state.open = status
    }

    const toggleMenuExpand = (expand = !state.menu_expand) => {
        state.menu_expand = expand
    }

    return {
        state,
        setAuthNode,
        setNavUserMenus,
        mergeNavUserMenus,
        mergeAuthNode,
        setUserMenus,
        setShowHeadline,
        setShrink,
        setStatus,
        toggleMenuExpand,
    }
})

function encodeRoutesURI(data: Menus[]) {
    data.forEach((item) => {
        if (item.meta.menu_type == 'iframe') {
            item.path = '/user/iframe/' + encodeURIComponent(item.path)
        }

        if (item.children && item.children.length) {
            item.children = encodeRoutesURI(item.children)
        }
    })
    return data
}
