
export default [
    {
        path: "/",
        component: () => import('~/pages/index.vue'),
        meta: {
            title: '首页',
            layout: 'default',
            menu: true,
        }
    },
    {
        // 框架默认搜索页（搜索插件的兜底；插件可覆盖本路由）
        path: "/search",
        component: () => import('~/pages/search.vue'),
        meta: {
            title: '搜索',
            layout: 'default',
            menu: false,
        }
    },
    {
        // 个人中心默认落点：302 到概述页（个人中心分组首个子项，与 tag 导航一致）
        path: "/member",
        redirect: '/member/overview',
        meta: {
            title: '个人中心',
            layout: 'default',
            menu: false,
        }
    },
    {
        path: "/member/profile",
        component: () => import('~/pages/member/components/profile/index.vue'),
        meta: {
            title: '个人资料',
            layout: 'member',
            menu: false,
            category: '2',
            parent: '/member',
            parentTitle: '个人中心',
            order: 10,
            icon: 'mdi:account-circle',
            is_public: false,
            is_no_auth: true,
            code: 'member:profile',
        }
    },
    {
        path: "/member/settings",
        component: () => import('~/pages/member/components/settings/index.vue'),
        meta: {
            title: '用户设置',
            layout: 'member',
            menu: false,
            category: '2',
            parent: '/member',
            parentTitle: '个人中心',
            order: 11,
            icon: 'mdi:cog',
            is_public: false,
            is_no_auth: true,
            code: 'member:settings',
        }
    },
    {
        path: "/member/third-party",
        component: () => import('~/pages/member/components/third-party/index.vue'),
        meta: {
            title: '第三方绑定',
            layout: 'member',
            menu: false,
            category: '2',
            parent: '/member',
            parentTitle: '个人中心',
            order: 12,
            icon: 'mdi:link-variant',
            is_public: false,
            is_no_auth: true,
            code: 'member:third-party',
        }
    },
    {
        path: "/member/password",
        component: () => import('~/pages/member/components/password/index.vue'),
        meta: {
            title: '修改密码',
            layout: 'member',
            menu: false,
            category: '2',
            parent: '/member',
            parentTitle: '个人中心',
            order: 13,
            icon: 'mdi:key-variant',
            is_public: false,
            is_no_auth: true,
            code: 'member:password',
        }
    },
    {
        path: "/member/points",
        component: () => import('~/pages/member/components/points/index.vue'),
        meta: {
            title: '积分记录',
            layout: 'member',
            menu: false,
            category: '2',
            parent: '/member',
            parentTitle: '个人中心',
            order: 14,
            icon: 'mdi:star-circle',
            is_public: false,
            is_no_auth: true,
            code: 'member:points',
        }
    },
    {
        path: "/member/balance",
        component: () => import('~/pages/member/components/balance/index.vue'),
        meta: {
            title: '余额记录',
            layout: 'member',
            menu: false,
            category: '2',
            parent: '/member',
            parentTitle: '个人中心',
            order: 15,
            icon: 'mdi:wallet',
            is_public: false,
            is_no_auth: true,
            code: 'member:balance',
        }
    },
    {
        path: "/member/sign",
        component: () => import('~/pages/member/components/sign/index.vue'),
        meta: {
            title: '每日签到',
            layout: 'member',
            menu: false,
            category: '2',
            parent: '/member',
            parentTitle: '个人中心',
            order: 16,
            icon: 'mdi:calendar-check',
            is_public: false,
            is_no_auth: true,
            code: 'member:sign',
        }
    },
]
