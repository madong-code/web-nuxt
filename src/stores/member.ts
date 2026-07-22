import { defineStore } from 'pinia'
import { getMemberProfile } from '~/api/member'
import { navigateTo } from 'nuxt/app'
import { useSystemStore } from '~/stores/system'


interface Member {
    token: string | null
    refreshToken: string | null
    info: Record<string, any> | null,
    loginPopup: boolean
    /** 权限码列表（登录时下发 + getMemberInfo 时更新） */
    permissions: string[]
}


export const useMemberStore = defineStore('member', {
    state: (): Member => {
        return {
            token: '',
            refreshToken: '',
            info: null,
            loginPopup: false,
            permissions: []
        }
    },
    actions: {
        async setToken(token: string, refreshToken: string, permissions?: string[]) {
            this.token = token
            this.refreshToken = refreshToken
            this.info = null
            // 登录时下发的权限码直接保存
            if (permissions && permissions.length > 0) {
                this.permissions = permissions
            }
            // 先获取用户信息，再刷新菜单（确保 checkMenuPermission 能正确判断登录状态）
            await this.getMemberInfoSilent()
            this.refreshMenuAfterLogin()
        },
        // 内部方法：拉取并写入会员信息（getMemberInfo / getMemberInfoSilent 共用）
        async fetchMemberProfile() {
            if (!this.token) {
                return
            }
            try {
                const res: any = await getMemberProfile()
                this.info = res || null
                // 后端返回的 permissions 合入 store
                if (res?.permissions) {
                    this.permissions = res.permissions
                }
            } catch (err) {
                console.error('[getMemberInfo] Error:', err)
                this.info = null
            }
        },
        async getMemberInfo() {
            await this.fetchMemberProfile()
        },
        async getMemberInfoSilent() {
            await this.fetchMemberProfile()
        },
        logout() {
            this.token = ''
            this.refreshToken = ''
            this.info = null
            this.permissions = []
            this.loginPopup = false
            // 登出后刷新菜单（混合/后端模式下后端只返回公开菜单）
            this.refreshMenuAfterLogin()
            // 跳转到首页
            navigateTo('/')
        },
        logOpen() {
            this.loginPopup = true
        },
        logClose() {
            this.loginPopup = false
        },
        /**
         * 登录/登出后刷新菜单
         * 所有模式下都强制刷新菜单，确保菜单按最新登录状态重建
         * - 前端模式：重新从路由构建菜单骨架，checkMenuPermission 重新计算可见性
         * - 混合/后端模式：重新请求后端权限过滤后的菜单数据
         */
        refreshMenuAfterLogin() {
            try {
                const systemStore = useSystemStore()
                systemStore.getSiteInfoFn(true)
            } catch (e) {
                console.error('[refreshMenuAfterLogin] Error:', e)
            }
        }
    },
    persist: {
        key: 'member-store',
        pick: ['token', 'refreshToken', 'info', 'loginPopup', 'permissions']
    }
})
