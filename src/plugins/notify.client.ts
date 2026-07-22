import { defineNuxtPlugin } from '#app'
import { watch } from 'vue'
import { useMemberStore } from '~/stores/member'
import { useSystemStore } from '~/stores/system'
import { useOfficialNotifyStore } from '~/plugin/portal/stores/notify'

/**
 * 全局初始化「消息铃铛」未读徽章。
 *
 * 历史实现中该初始化仅在门户首页（/ 路由）的 index.vue 中调用，
 * 导致刷新非首页路由时首页组件不会挂载、init 不执行，header 铃铛的
 * setHeaderActionBadge 永不被触发，徽章因此只在 / 路由出现。
 *
 * 改为在应用级客户端插件中初始化，与具体页面解耦：
 * 任意路由刷新后，只要登录态与站点菜单就绪即可拉取未读数并设置徽章。
 */
export default defineNuxtPlugin(() => {
    if (!import.meta.client) return

    const memberStore = useMemberStore()
    const systemStore = useSystemStore()
    const notifyStore = useOfficialNotifyStore()

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
