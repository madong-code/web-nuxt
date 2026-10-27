<template>
    <!--
        移动端导航抽屉：el-drawer 挂到 body（append-to-body）。
        注意：header 的 backdrop-filter 会为 fixed 后代建立包含块，
        抽屉若放在 header 内部做 fixed 定位会被顶栏高度压成 0 高度，
        因此独立成组件并 append-to-body（与框架既有 mobile-drawer 结构对齐）。
    -->
    <el-drawer
        v-model="visible"
        class="md-nav-drawer"
        :append-to-body="true"
        :with-header="false"
        direction="ltr"
        size="78%"
    >
        <!-- 抽屉头：品牌 + 关闭（Logo 与桌面端 header 同源：站点设置 site_logo，私有空间签名门控对齐） -->
        <div class="md-drawer-head">
            <NuxtLink to="/" class="flex items-center gap-2 min-w-0" @click="close">
                <img
                    v-if="siteLogo && !logoPending"
                    :src="fullUrl(siteLogo)"
                    :alt="siteName"
                    class="h-8 w-auto object-contain"
                >
                <span v-else class="w-8 h-8 rounded-lg bg-[color:var(--md-primary)] flex items-center justify-center shrink-0">
                    <Newspaper class="w-4 h-4 text-white" />
                </span>
                <span class="text-base font-semibold text-[color:var(--md-text-1)] truncate">{{ siteName }}</span>
            </NuxtLink>
            <button
                class="md-drawer-close"
                aria-label="Close menu"
                @click="close"
            >
                <X class="w-5 h-5 text-[color:var(--md-primary)]" />
            </button>
        </div>

        <!-- 搜索：唤起悬浮面板（移动端抽屉内带文字全宽按钮） -->
        <div class="md-drawer-search">
            <SearchBar show-text :show-shortcut="false" class="ps-trigger-block" />
        </div>

        <!-- 导航：web_menu 菜单树（与桌面端同源，均由后端接口驱动；递归支持任意层级） -->
        <nav class="md-drawer-nav">
            <MobileDrawerItem
                v-for="entry in entries"
                :key="entry.key"
                :item="entry"
                :indent="0"
            />
        </nav>

        <!-- 工具区：主题 / 多语言 / 头部扩展动作（cat=3，通知/私信已并入会员菜单不重复出现） -->
        <div class="md-drawer-foot">
            <div v-if="configStore.theme.is_enabled" class="md-drawer-tool-row">
                <ThemePanel />
            </div>

            <template v-if="langEnabled">
                <div class="px-4 pt-3 pb-1 text-xs text-[color:var(--md-text-3)] select-none">{{ t('common.language') }}</div>
                <button
                    v-for="item in availableLanguages"
                    :key="item.name"
                    class="mobile-nav-link w-full"
                    :class="item.name === currentLanguage ? 'mobile-nav-link-active' : ''"
                    @click="handleLanguageChange(item.name)"
                >
                    <Languages class="w-4 h-4 shrink-0" />
                    {{ item.value }}
                </button>
            </template>

            <template v-for="action in extraActions" :key="actionKey(action)">
                <button class="mobile-nav-link w-full" @click="onActionClick(action)">
                    <span class="relative flex items-center shrink-0">
                        <Icon :icon="action.icon || 'mdi:bell'" :size="16" />
                        <span v-if="badgeCount(action) > 0" class="md-menu-badge">{{ formatBadge(badgeCount(action)) }}</span>
                    </span>
                    {{ action.title }}
                </button>
            </template>
        </div>

        <!-- 登录用户区：头像行（徽章锚定头像正上方，与桌面端头像一致）+ 可折叠会员菜单（默认折叠） -->
        <div class="md-drawer-foot">
            <template v-if="memberStore.info">
                <button
                    class="drawer-member-head"
                    :aria-expanded="memberOpen"
                    @click="memberOpen = !memberOpen"
                >
                    <span class="relative inline-flex shrink-0">
                        <img
                            :src="memberStore.info.avatar ? fullUrl(memberStore.info.avatar) : defaultAvatar"
                            :alt="memberStore.info.nickname || memberStore.info.username"
                            class="w-8 h-8 rounded-full object-cover"
                        />
                        <!-- 未读总数徽章：锚定头像正上方（与桌面端头像徽章同位），0 自动隐藏，>99 显示 99+ -->
                        <span v-if="totalUnreadBadge" class="drawer-avatar-badge">{{ totalUnreadBadge }}</span>
                        <!-- 未读闪烁标识：数字或红点任一存在时右下角呼吸闪烁（与桌面端一致） -->
                        <span v-if="totalUnread > 0 || hasDotUnread" class="drawer-avatar-dot" aria-hidden="true"></span>
                    </span>
                    <span class="flex-1 min-w-0 text-left text-[15px] text-[color:var(--md-text-1)] truncate">
                        {{ memberStore.info.nickname || memberStore.info.username }}
                    </span>
                    <ChevronDown
                        class="w-4 h-4 shrink-0 text-[color:var(--md-text-3)] transition-transform"
                        :class="memberOpen ? 'rotate-180' : ''"
                    />
                </button>
                <!-- 会员菜单（web_menu category=2，与桌面端头像下拉同源）：默认折叠，点击头像行展开 -->
                <div v-show="memberOpen" class="bg-[color:var(--md-fill)]">
                    <template v-for="(row, i) in memberRows" :key="`mb-${i}-${row.to}`">
                        <div
                            v-if="!row.to"
                            class="px-4 pt-3 pb-1 text-xs text-[color:var(--md-text-3)] select-none"
                        >{{ row.label }}</div>
                        <NuxtLink
                            v-else
                            :to="row.to"
                            :target="row.external ? '_blank' : undefined"
                            :rel="row.external ? 'noopener' : undefined"
                            class="mobile-nav-link"
                            :class="isMemberRowActive(row.to) ? 'mobile-nav-link-active' : ''"
                            @click="close"
                        >
                            <span class="relative flex items-center shrink-0">
                                <component :is="row.icon" class="w-4 h-4" />
                                <span v-if="row.badge" class="md-menu-badge">{{ row.badge }}</span>
                                <span v-else-if="row.dot" class="md-menu-dot"></span>
                            </span>
                            {{ row.label }}
                        </NuxtLink>
                    </template>
                </div>
                <button
                    class="mobile-nav-link w-full text-[color:var(--el-color-danger)]"
                    @click="emit('logout')"
                >
                    <LogOut class="w-4 h-4" />
                    {{ $t('common.logout_login') }}
                </button>
            </template>
            <button
                v-else
                class="mobile-nav-link w-full text-[color:var(--md-primary)]"
                @click="emit('login')"
            >
                <CircleUser class="w-4 h-4" />
                {{ $t('common.login') }}
            </button>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { Newspaper, LogOut, CircleUser, X, Languages, ChevronDown } from 'lucide-vue-next'
import { t } from '~/composables/lang'
const $t = t
import SearchBar from './search-bar.vue'
import MobileDrawerItem from './mobile-drawer-item.vue'
import ThemePanel from './theme-panel.vue'
import { Icon } from '~/components/icon'
import { fullUrl } from '~/utils/common'
import defaultAvatar from '~/assets/images/default_avatar.png'
import { useMemberStore } from '~/stores/member'
import { useConfigStore } from '~/stores/config'
import { useHeaderActions, isMergedUnreadAction } from '~/composables/header-actions'
import { useMemberBadges, type MemberRow } from '~/composables/member-menu'
import { resolveSignedUrl, isPrivateResourcePending } from '~/utils/private-storage'
import type { Menus } from '~/stores/interface'

/** 导航条目（与统一 header 的 NavEntry 同构） */
export interface NavChild {
    label: string
    to: string
    external: boolean
    active: boolean
    children: NavChild[] | null
}
export interface NavEntry extends NavChild {
    key: string
}

const props = defineProps<{
    modelValue: boolean
    entries: NavEntry[]
    memberRows: MemberRow[]
    siteName: string
    siteLogo?: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    login: []
    logout: []
}>()

const memberStore = useMemberStore()
const configStore = useConfigStore()
const route = useRoute()

// 私有空间 Logo 签名门控（与桌面端 header 同逻辑）：签名就绪才渲染真实 Logo，
// 换取失败保持品牌占位，不产生裸链请求
const logoPending = computed(() => {
    const logo = (props.siteLogo || '').trim()
    if (logo === '') return false
    resolveSignedUrl(logo)
    return isPrivateResourcePending(logo)
})

const visible = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v),
})

function close() {
    emit('update:modelValue', false)
}

// 抽屉导航为递归组件，任意层级点击链接后统一经此收起抽屉
provide('md-drawer-close', close)

// 路由变化时收起移动端抽屉
watch(
    () => route.path,
    () => {
        if (visible.value) close()
    },
)

// ====== 工具区：多语言 / 主题 / 头部扩展动作（cat=3） ======
const systemStore = useSystemStore()

const langEnabled = computed(() => configStore.language.is_enabled && availableLanguages.value.length > 1)
const availableLanguages = computed(() => systemStore.getLanguages)
const currentLanguage = computed(() => systemStore.lang)

function handleLanguageChange(lang: string) {
    systemStore.setLanguage(lang)
}

/** 桌面/移动共用：cat=3 动作列表（通知/私信已并入会员菜单，过滤逻辑与桌面端同源） */
const { actions, actionKey, badgeCount, handleClick } = useHeaderActions()
const extraActions = computed<Menus[]>(() =>
    actions.value.filter((m) => !isMergedUnreadAction(m.path)),
)

function onActionClick(action: Menus) {
    handleClick(action, close)
}

const formatBadge = (n: number): string => (n > 99 ? '99+' : String(n))

// ====== 会员区：头像行（未读徽章与桌面端头像同位）+ 默认折叠的会员菜单 ======
const memberOpen = ref(false)
const { totalUnread, hasDotUnread } = useMemberBadges()
const totalUnreadBadge = computed(() => (totalUnread.value > 0 ? formatBadge(totalUnread.value) : ''))

/** 抽屉会员菜单项激活态：路径精确匹配 + query 参数逐项比对 */
function isMemberRowActive(to: string): boolean {
    const qIdx = to.indexOf('?')
    const path = qIdx === -1 ? to : to.slice(0, qIdx)
    if (route.path !== path) return false
    if (qIdx === -1) return !route.query.tab
    const query = to.slice(qIdx + 1)
    return Array.from(new URLSearchParams(query).entries()).every(
        ([k, v]) => String(route.query[k] ?? '') === v,
    )
}
</script>

<style scoped>
.md-drawer-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--md-border);
}

.md-drawer-close {
  display: flex;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.md-drawer-close:hover {
  background: var(--md-fill);
}

.md-drawer-search {
  flex-shrink: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--md-border);
}

/* 抽屉内搜索钮：全宽浅灰胶囊，视觉等同搜索框入口 */
.md-drawer-search :deep(.ps-trigger-block) {
  width: 100%;
  justify-content: flex-start;
  padding: 9px 12px;
  background: var(--md-fill);
  color: var(--md-text-3);

  &:hover {
    background: var(--el-fill-color);
    color: var(--md-primary);
  }
}

.md-drawer-nav {
  flex: 1;
  padding: 6px 0;
  overflow-y: auto;
}

.md-drawer-foot {
  flex-shrink: 0;
  padding: 6px 0;
  border-top: 1px solid var(--md-border);
}

.md-drawer-tool-row {
  display: flex;
  align-items: center;
  padding: 6px 16px;
}

/* ===== 会员头像行：徽章/呼吸点视觉与桌面端头像（header.vue）保持一致 ===== */
.drawer-member-head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  transition: background-color 0.2s ease;
}

.drawer-member-head:hover {
  background: var(--md-fill);
}

/* 未读总数徽章：锚定头像正上方（同桌面端 -top-2 居中），0 隐藏、>99 显示 99+ */
.drawer-avatar-badge {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 9999px;
  background: var(--el-color-danger);
  color: #ffffff;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
  font-weight: 500;
  pointer-events: none;
}

/* 未读呼吸闪烁点：右下角实心点 + 扩散光圈，纯 CSS 动画，pointer-events 穿透 */
.drawer-avatar-dot {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 9px;
  height: 9px;
  border-radius: 9999px;
  background: var(--el-color-danger);
  box-shadow: 0 0 0 2px var(--md-bg);
  pointer-events: none;
}

.drawer-avatar-dot::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--el-color-danger);
  animation: drawer-unread-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes drawer-unread-ping {
  0% {
    transform: scale(1);
    opacity: 0.65;
  }
  75%,
  100% {
    transform: scale(2.6);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawer-avatar-dot::before {
    animation: none;
    opacity: 0;
  }
}

/*
 * 移动端抽屉导航行样式：递归子组件 mobile-drawer-item 内也复用，
 * 故以 :global 声明（类名为 md- 专属前缀，不会污染全局）。
 */
:global(.mobile-nav-link) {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    font-size: 15px;
    color: var(--md-text-1);
    transition: background-color 0.2s ease, color 0.2s ease;
}

:global(.mobile-nav-link:hover) {
    background: var(--md-fill);
}

:global(.mobile-nav-link-active) {
    color: var(--md-primary);
    font-weight: 500;
    background: color-mix(in srgb, var(--md-primary) 6%, transparent);
}

:global(.mobile-nav-link-active::before) {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: var(--md-primary);
}

:global(.mobile-sub-toggle) {
    display: flex;
    align-items: center;
    padding: 0 16px;
    color: var(--md-text-3);
    transition: color 0.2s ease;
}

:global(.mobile-sub-toggle:hover) {
    color: var(--md-primary);
}

/* ===== 移动端 el-drawer（面板 teleport 到 body，外壳覆写需用 :global） ===== */
:global(.md-nav-drawer) {
  border-radius: 0 16px 16px 0;
  overflow: hidden;
}

:global(.md-nav-drawer .el-drawer__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}
</style>

<style lang="scss">
/* 菜单项未读徽章（移动抽屉 + 桌面下拉共用契约类，全局声明一次） */
.md-menu-badge {
    position: absolute;
    top: -6px;
    right: -10px;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    border-radius: 9999px;
    background: var(--el-color-danger);
    color: #ffffff;
    font-size: 9px;
    line-height: 14px;
    text-align: center;
    font-weight: 500;
    pointer-events: none;
}

/* 菜单项红点徽章（dot 模式：仅提示不显数） */
.md-menu-dot {
    position: absolute;
    top: -4px;
    right: -8px;
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background: var(--el-color-danger);
    box-shadow: 0 0 0 2px var(--md-bg);
    pointer-events: none;
}
</style>
