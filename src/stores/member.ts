import { defineStore } from 'pinia'
import { getMemberProfile } from '~/api/member'
import { navigateTo } from 'nuxt/app'


interface Member {
    token: string | null
    refreshToken: string | null
    info: Record<string, any> | null,
    loginPopup: boolean
}


export const useMemberStore = defineStore('member', {
    state: (): Member => {
        return {
            token: '',
            refreshToken: '',
            info: null,
            loginPopup: false
        }
    },
    actions: {
        async setToken(token: string, refreshToken: string) {
            this.token = token
            this.refreshToken = refreshToken
            this.info = null
            // 静默获取用户信息，不阻塞 token 设置
            // 如果失败不执行 logout，保留 refreshToken 以便后续刷新
            this.getMemberInfoSilent()
        },
        async getMemberInfo() {
            if (!this.token) {
                return
            }
            await getMemberProfile()
                .then((res: any) => {
                    this.info = res || null
                })
                .catch((err) => {
                    console.error('[getMemberInfo] Error:', err)
                    // 这里不调用 logout，保留 refreshToken 以便 token 刷新机制工作
                    this.info = null
                })
        },
        async getMemberInfoSilent() {
            // 静默获取用户信息，不抛出错误
            if (!this.token) {
                return
            }
            try {
                const res: any = await getMemberProfile()
                this.info = res || null
            } catch (err) {
                console.error('[getMemberInfoSilent] Error:', err)
                // 不执行 logout，只清除 info
                this.info = null
            }
        },
        logout() {
            this.token = ''
            this.refreshToken = ''
            this.info = null
            this.loginPopup = false
            // 跳转到首页
            navigateTo('/')
        },
        logOpen() {
            this.loginPopup = true
        },
        logClose() {
            this.loginPopup = false
        }
    },
    persist: {
        key: 'member-store',
        pick: ['token', 'refreshToken', 'info', 'loginPopup']
    }
})
