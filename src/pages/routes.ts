
export default [
    {
        path: "/",
        component: () => import('~/pages/index.vue'),
        meta: {
            title: '首页',
            // menu 默认 true，无需显式声明
            category: '1',
            order: 0,
            icon: 'mdi:home',
        }
    },
    {
        path: "/member/profile",
        component: () => import('~/pages/member/components/profile/index.vue'),
        meta: {
            title: '个人资料',
            layout: 'member',
            category: '2',
            parent: '/member/account',
            parentTitle: '账户设置',
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
            category: '2',
            parent: '/member/account',
            parentTitle: '账户设置',
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
            category: '2',
            parent: '/member/account',
            parentTitle: '账户设置',
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
            category: '2',
            parent: '/member/account',
            parentTitle: '账户设置',
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
            category: '2',
            parent: '/member/account',
            parentTitle: '账户设置',
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
            category: '2',
            parent: '/member/account',
            parentTitle: '账户设置',
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
            category: '2',
            parent: '/member/account',
            parentTitle: '账户设置',
            order: 16,
            icon: 'mdi:calendar-check',
            is_public: false,
            is_no_auth: true,
            code: 'member:sign',
        }
    },
]
