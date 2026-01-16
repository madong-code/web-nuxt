export default [
    {
        path: "/",
        component: () => import('~/pages/index.vue')
    },
    {
        path: "/member/profile",
        component: () => import('~/pages/member/profile.vue'),
        meta: {
            title: '会员中心',
            layout: 'member'
        }
    },
]
