import { useMemberStore } from '~/stores/member'
import { getMemberProfile } from '~/api/member'
import { refreshToken } from '~/api/auth'

export default defineNuxtPlugin(async () => {
    // 仅在客户端执行
    if (!import.meta.client) return

    // 等待一下让 pinia 持久化插件完成初始化
    await new Promise(resolve => setTimeout(resolve, 100))

    const memberStore = useMemberStore()

    // 如果没有 token 但有 refreshToken，尝试刷新
    if (memberStore.refreshToken && !memberStore.token) {
        try {
            const response: any = await refreshToken(memberStore.refreshToken)

            if (response.code === 0 && response.data) {
                memberStore.token = response.data.access_token
                memberStore.refreshToken = response.data.refresh_token
            } else {
                memberStore.logout()
            }
        } catch (error) {
            memberStore.logout()
        }
    } else if (memberStore.token && memberStore.refreshToken) {
        // 如果有 token 和 refreshToken，尝试获取用户信息
        try {
            const data: any = await getMemberProfile()

            if (data && data.id) {
                memberStore.info = data
            } else {
                memberStore.info = null
            }
        } catch (error: any) {
            // 如果是 401 错误，尝试刷新 token
            if (error?.message?.includes('401') || error?.response?.status === 401) {
                try {
                    const refreshResponse: any = await refreshToken(memberStore.refreshToken)

                    if (refreshResponse.code === 0 && refreshResponse.data) {
                        memberStore.token = refreshResponse.data.access_token
                        memberStore.refreshToken = refreshResponse.data.refresh_token

                        // 刷新成功后重新获取用户信息
                        const userInfo: any = await getMemberProfile()
                        if (userInfo && userInfo.id) {
                            memberStore.info = userInfo
                        }
                    } else {
                        memberStore.logout()
                    }
                } catch (refreshError) {
                    memberStore.logout()
                }
            } else {
                memberStore.info = null
            }
        }
    }
})
