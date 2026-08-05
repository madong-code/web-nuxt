import { defineNuxtPlugin } from '#app'
import { watch } from 'vue'
import { useMemberStore } from '~/stores/member'
import { useSystemStore } from '~/stores/system'
import { useNotifyStore } from '~/stores/notify'

/**
 * 全局通知调度插件（核心层，可插拔）。
 *
 * 本插件不依赖任何具体插件：它只负责在「已登录 + 站点菜单就绪」时
 * 调度通用 notify store 的 init / cleanup。通知数据源由各插件通过
 * registerNotifyProvider() 接入；即使没有任何插件注册 provider，
 * 本插件也能正常运行（空转不报错），因此移除 / 新增插件互不影响。
 */
export default defineNuxtPlugin(() => {
    if (!import.meta.client) return

    const memberStore = useMemberStore()
    const systemStore = useSystemStore()
    const notifyStore = useNotifyStore()

    // 防止同一生命周期内重复初始化（重复添加监听/定时器）
    let started = false

    const tryInit = () => {
        if (started) return
        if (memberStore.info && systemStore.site.initialize) {
            started = true
            notifyStore.init()
        }
    }

    // 登录态变化：登录后初始化，登出后清理并允许再次初始化
    watch(
        () => memberStore.info,
        (newInfo, oldInfo) => {
            if (newInfo && !oldInfo) {
                tryInit()
            } else if (!newInfo && oldInfo) {
                started = false
                notifyStore.cleanup()
            }
        }
    )

    // 站点菜单（含 header_actions 铃铛入口）初始化完成后初始化通知
    watch(
        () => systemStore.site.initialize,
        (initialized) => {
            if (initialized && memberStore.info) {
                tryInit()
            }
        }
    )

    // 首屏若条件已满足则立即初始化
    tryInit()
})
