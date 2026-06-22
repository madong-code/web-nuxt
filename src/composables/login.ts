import type { LocationQueryRaw } from 'vue-router'
import storage from '@/utils/storage'

export function useLogin() {
    /**
     * 设置登录返回页
     */
    const setLoginBack = (route: LocationQueryRaw) => {
        storage.set({
            key: 'loginBack',
            data: {
                path: route.path,
                query: route.query
            }
        })
    }

    /**
     * 执行登录后跳转
     */
    const handleLoginBack = (callbak:any) => {
        if(callbak) callbak()
    }

    return {
        setLoginBack,
        handleLoginBack
    }
}
