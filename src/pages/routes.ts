

export default [
    {
        path: "/",
        component: () => import('~/pages/index.vue'),
        meta: {
            title: '首页',
        }
    },
    {
        path: "/member/profile",
        component: () => import('~/pages/member/components/profile/index.vue'),
        meta: {
            title: '个人资料',
            layout: 'member'
        }
    },
    {
        path: "/member/settings",
        component: () => import('~/pages/member/components/settings/index.vue'),
        meta: {
            title: '用户设置',
            layout: 'member'
        }
    },
    {
        path: "/member/password",
        component: () => import('~/pages/member/components/password/index.vue'),
        meta: {
            title: '修改密码',
            layout: 'member'
        }
    },
    {
        path: "/member/points",
        component: () => import('~/pages/member/components/points/index.vue'),
        meta: {
            title: '积分记录',
            layout: 'member'
        }
    },
    {
        path: "/member/balance",
        component: () => import('~/pages/member/components/balance/index.vue'),
        meta: {
            title: '余额记录',
            layout: 'member'
        }
    },
    {
        path: "/member/sign",
        component: () => import('~/pages/member/components/sign/index.vue'),
        meta: {
            title: '每日签到',
            layout: 'member'
        }
    }
]
