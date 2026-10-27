<template>
    <!--
        层级说明：z-[102] 必须高于页面级固定定位元素（如文档阅读页左侧菜单 z-100、
        收起按钮 z-101、右侧目录面板 z-99）。下拉菜单（头像/导航子菜单/更多）都在
        顶栏层叠上下文内渲染，顶栏层级过低时会被这些 fixed 面板遮挡。
    -->
    <div
        class="h-[68px] relative z-[102] w-full bg-[color:var(--md-header-bg)] backdrop-blur border-b border-[color:var(--md-border)] transition-shadow"
        :class="{ 'is-scrolled': isScrolled }"
    >
        <div
            class="h-full flex items-center gap-4 md:gap-6"
            :class="isDocReader ? 'w-full px-5' : 'max-w-[1250px] mx-auto px-4'"
        >
            <!-- Logo（后台站点设置：自定义 Logo + 站点名称；私有空间 SSR 渲染品牌占位防直链泄露，签名就绪后切换） -->
            <NuxtLink to="/channel/home" class="flex items-center gap-2.5 shrink-0">
                <img
                    v-if="cfg.site_logo && !logoPending"
                    :src="fullUrl(cfg.site_logo)"
                    :alt="cfg.site_name"
                    class="h-9 w-auto object-contain"
                >
                <span v-else class="w-9 h-9 rounded-lg bg-[color:var(--md-primary)] flex items-center justify-center">
                    <Newspaper class="w-5 h-5 text-white" />
                </span>
                <span class="text-[17px] md:text-[19px] font-semibold text-[color:var(--md-text-1)] truncate">
                    {{ cfg.site_name || 'Madong Portal' }}
                </span>
            </NuxtLink>

            <!--
                主导航（桌面端）：完全以 web 后台菜单管理（md_web_menu category=1）为准，后端动态输出，
                前端不硬编码导航项；宽度不足时溢出项自动收入末尾「更多」下拉。
                route.meta.site_nav === false 时隐藏（搜索页等聚焦场景，对齐 portal_footer 开关模式）。
            -->
            <nav
                v-if="showNav"
                id="site-nav"
                ref="navEl"
                class="flex-1 relative hidden md:flex items-stretch h-full min-w-0"
            >
                <div
                    v-for="(entry, idx) in entries"
                    :key="entry.key"
                    :ref="(el) => { if (el) itemEls[idx] = el as HTMLElement }"
                    class="nav-item-wrap h-full flex items-stretch"
                    :style="idx >= visibleCount ? 'display:none' : ''"
                >
                    <!-- 单个导航项（含多级子栏目下拉，递归组件内处理；dialog 型菜单弹窗渲染） -->
                    <HeaderMenu :item="entry" :depth="0" />
                </div>

                <!-- 溢出收纳：超出宽度的导航项（含各级子栏目按层级缩进平铺）收入「更多」 -->
                <div
                    data-nav-more
                    class="relative group h-full flex items-stretch shrink-0"
                    :style="overflowEntries.length ? '' : 'display:none'"
                >
                    <button
                        type="button"
                        class="nav-top-link"
                        :class="overflowActive ? 'nav-top-link-active' : ''"
                    >
                        {{ $t('common.more') }}
                        <ChevronDown class="w-3.5 h-3.5 opacity-60" />
                    </button>
                    <div class="absolute right-0 top-full z-30 hidden pt-1.5 group-hover:block">
                        <div class="min-w-44 max-h-[70vh] overflow-y-auto bg-[color:var(--md-bg)] rounded-lg border border-[color:var(--md-border)] shadow-lg py-1.5">
                            <NuxtLink
                                v-for="({ row, depth }, i) in overflowRows"
                                :key="`${row.to}-${i}`"
                                :to="row.to"
                                :target="row.external ? '_blank' : undefined"
                                :rel="row.external ? 'noopener' : undefined"
                                class="block pr-4 py-2 whitespace-nowrap transition-colors"
                                :class="row.active
                                    ? (depth > 0 ? 'text-[color:var(--md-primary)] bg-[color:var(--md-fill)]' : 'text-[color:var(--md-primary)] font-medium bg-[color:var(--md-fill)]')
                                    : (depth > 0 ? 'text-[color:var(--md-text-3)] hover:text-[color:var(--md-primary)] hover:bg-[color:var(--md-fill)]' : 'text-[color:var(--md-text-2)] hover:text-[color:var(--md-primary)] hover:bg-[color:var(--md-fill)]')"
                                :style="{ paddingLeft: `${16 + depth * 14}px`, fontSize: depth > 0 ? '13px' : '14px' }"
                            >
                                {{ row.label }}
                            </NuxtLink>
                        </div>
                    </div>
                </div>

                <!--
                    首屏防晃动：SSR 直出为全量导航，浏览器可能在注水前就完成首绘，
                    导致「先全量渲染、JS 执行后再收进更多」的闪跳。因此随页面输出一段
                    bodyClose 内联脚本（见下方 useHead），在首次绘制前同步完成溢出测量
                    与收纳，并把结果挂到 window.__MD_NAV_COUNT 供注水初始状态复用，
                    保证前后一致零晃动。
                -->
            </nav>

            <!-- 搜索：固定嵌入导航栏的搜索框（桌面端），点击唤起悬浮面板；
                 ml-auto：meta.site_nav=false 隐藏导航后由它把右侧动作组推到行尾 -->
            <div class="hidden md:flex items-center shrink-0 ml-auto">
                <SearchBar embedded />
            </div>

            <!-- 头部扩展动作（web_menu category=3，插件可动态注册；通知/私信已并入头像下拉不重复渲染）
                 mounted 门控：动作数据由客户端 init 插件填充，SSR 阶段恒为空而注水时已就绪，
                 会产生结构性 hydration mismatch → 挂载后再渲染（SSR 本就不输出，视觉无回归） -->
            <div v-if="mounted && extraActions.length" class="hidden md:flex items-center gap-1 shrink-0">
                <template v-for="action in extraActions" :key="actionKey(action)">
                    <el-badge
                        :value="badgeCount(action)"
                        :max="99"
                        :hidden="badgeCount(action) <= 0"
                        class="header-action-badge"
                    >
                        <button
                            type="button"
                            class="p-2 rounded-md text-[color:var(--md-text-1)] hover:bg-[color:var(--md-fill)] transition-colors"
                            :title="action.title"
                            :aria-label="action.title"
                            @click="handleClick(action)"
                        >
                            <Icon :icon="action.icon || 'mdi:bell'" :size="18" />
                        </button>
                    </el-badge>
                </template>
            </div>

            <!-- 主题设置（主题色 + 暗黑外观合并面板，能力沿用框架 theme-panel） -->
            <div v-if="configStore.theme.is_enabled" class="hidden md:flex items-center shrink-0">
                <ThemePanel />
            </div>

            <!-- 多语言切换（沿用框架语言能力；门户头部风格轻量下拉；mounted 门控同扩展动作） -->
            <div v-if="mounted && langEnabled" class="relative group hidden md:flex items-center shrink-0">
                <button
                    type="button"
                    class="p-2 rounded-md text-[color:var(--md-text-1)] hover:bg-[color:var(--md-fill)] transition-colors"
                    :title="t('common.language')"
                    :aria-label="t('common.language')"
                >
                    <Languages class="w-[18px] h-[18px]" />
                </button>
                <div class="absolute right-0 top-full z-30 hidden pt-1.5 group-hover:block">
                    <div class="min-w-32 bg-[color:var(--md-bg)] rounded-lg border border-[color:var(--md-border)] shadow-lg py-1.5">
                        <button
                            v-for="item in availableLanguages"
                            :key="item.name"
                            type="button"
                            class="w-full flex items-center px-4 py-2 text-sm transition-colors"
                            :class="item.name === currentLanguage
                                ? 'text-[color:var(--md-primary)] font-medium bg-[color:var(--md-fill)]'
                                : 'text-[color:var(--md-text-2)] hover:text-[color:var(--md-primary)] hover:bg-[color:var(--md-fill)]'"
                            @click="handleLanguageChange(item.name)"
                        >
                            {{ item.value }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- 登录入口（对接框架登录体系；移动端收进抽屉，避免与汉堡按钮挤在一行） -->
            <div class="hidden md:flex items-center gap-2 shrink-0">
                <!-- 已登录：头像下拉（会员菜单由 web_menu category=2 实时驱动） -->
                <div v-if="memberStore.info" class="relative group">
                    <button
                        class="px-2 py-1 rounded-md flex items-center gap-1.5 hover:bg-[color:var(--md-fill)] transition-colors"
                    >
                        <span class="relative inline-flex shrink-0">
                            <img
                                :src="memberStore.info.avatar ? fullUrl(memberStore.info.avatar) : defaultAvatar"
                                class="w-7 h-7 rounded-full object-cover"
                            />
                            <!-- 未读总数徽章：锚定头像正上方，0 自动隐藏，>99 显示 99+ -->
                            <span
                                v-if="totalUnreadBadge"
                                class="absolute -top-2 left-1/2 -translate-x-1/2 z-10 min-w-[16px] h-4 px-1 rounded-full bg-[color:var(--el-color-danger)] text-white text-[10px] leading-4 text-center font-medium pointer-events-none"
                            >{{ totalUnreadBadge }}</span>
                            <!-- 未读闪烁标识：数字或红点任一存在时右下角呼吸闪烁（纯 CSS 动画，pointer-events 穿透不影响交互） -->
                            <span v-if="totalUnread > 0 || hasDotUnread" class="md-unread-dot" aria-hidden="true"></span>
                        </span>
                        <!-- 字号/字体族/行高/字重与顶级导航项（.pnm-trigger-root/.nav-top-link 15px）保持一致 -->
                        <span class="text-[15px] leading-normal font-normal text-[color:var(--md-text-1)] hidden sm:inline max-w-[80px] truncate">
                            {{ memberStore.info.nickname || memberStore.info.username }}
                        </span>
                        <ChevronDown class="w-3.5 h-3.5 text-[color:var(--md-text-3)]" />
                    </button>
                    <div class="absolute right-0 top-full z-30 hidden pt-1.5 group-hover:block">
                        <div class="min-w-44 bg-[color:var(--md-bg)] rounded-lg border border-[color:var(--md-border)] shadow-lg py-1.5">
                            <!--
                                会员菜单：web_menu category=2（后台「菜单管理」实时配置），
                                递归多级分组渲染；后端已按 is_public/权限码/登录态过滤，
                                通知/私信项按 URL 关联未读徽章数据源。
                            -->
                            <MemberMenu :items="memberItems" />
                            <div class="my-1 border-t border-[color:var(--md-border)]"></div>
                            <!--
                                退出登录行：字号/间距/图标全部显式 px，与上方 .member-menu-row
                                （14px 字号、8px 14px 内边距、8px 间距、16px 图标）严格一致。
                                禁用 text-sm/px-4 等 rem 基准工具类——浏览器自定义默认字号会改
                                根字号（如 14px），rem 值整体缩放导致与前文菜单项不一致。
                            -->
                            <button
                                class="w-full flex items-center gap-[8px] px-[14px] py-[8px] text-[14px] text-[color:var(--el-color-danger)] hover:bg-[color:var(--el-color-danger-light-9)] transition-colors"
                                @click="memberStore.logout('/')"
                            >
                                <LogOut class="w-[16px] h-[16px]" />
                                {{ $t('common.logout_login') }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 未登录：登录按钮 → 框架全局登录弹窗 -->
                <button
                    v-else
                    class="px-3 py-2 rounded-md text-[15px] text-[color:var(--md-primary)] hover:bg-[color:color-mix(in_srgb,var(--md-primary)_10%,transparent)] transition-colors flex items-center gap-1"
                    @click="memberStore.logOpen()"
                >
                    <CircleUser class="w-4 h-4" />
                    <span class="hidden sm:inline">{{ $t('common.login') }}</span>
                </button>
            </div>

            <!-- 移动端菜单按钮（独立于会员入口容器，顶到最右；桌面端隐藏） -->
            <button
                class="md:hidden ml-auto p-2 -mr-2 rounded-md text-[color:var(--md-text-1)] hover:bg-[color:var(--md-fill)] transition-colors shrink-0"
                :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
                @click="mobileOpen = !mobileOpen"
            >
                <X v-if="mobileOpen" class="w-5 h-5" />
                <Menu v-else class="w-5 h-5" />
            </button>
        </div>

        <!-- 移动端导航抽屉（独立组件，append-to-body；含主题/语言/扩展动作工具区）。
             ClientOnly：抽屉为交互弹层，SSR 预渲染隐藏 overlay 会因 z-index 计数
             与客户端不一致产生注水样式 mismatch，且首屏无需其 DOM -->
        <ClientOnly>
            <MobileDrawer
                v-model="mobileOpen"
                :entries="entries"
                :member-rows="memberRows"
                :site-name="cfg.site_name"
                :site-logo="cfg.site_logo"
                @login="onMobileLogin"
                @logout="onMobileLogout"
            />
        </ClientOnly>
    </div>

    <!-- 框架全局登录弹窗（门户路由下也能用；ClientOnly 理由同抽屉） -->
    <ClientOnly>
        <LoginDialog />
    </ClientOnly>

    <!-- 菜单弹窗渲染器（web_menu dialog 型菜单点击后经 useMenuDialog 打开） -->
    <MenuDialog />

    <!-- 悬浮搜索面板（单例：桌面/移动触发钮共用） -->
    <SearchPanel />
</template>

<script setup lang="ts">
import { ChevronDown, LogOut, Menu, Newspaper, CircleUser, X, Languages } from 'lucide-vue-next'
import { fullUrl } from '~/utils/common'
import defaultAvatar from '~/assets/images/default_avatar.png'
import type { NavMenuItem } from '~/api/site'
import { useNav } from '~/composables/nav'
import { useSiteConfig } from '~/composables/site-config'
import { filterMemberTree, flattenMemberRows, useMemberBadges } from '~/composables/member-menu'
import { useMemberStore } from '~/stores/member'
import { useConfigStore } from '~/stores/config'
import { useSystemStore } from '~/stores/system'
import { useHeaderActions, isMergedUnreadAction } from '~/composables/header-actions'
import { t } from '~/composables/lang'
import { Icon } from '~/components/icon'
import LoginDialog from '~/components/login-dialog/index.vue'
import HeaderMenu from './menu.vue'
import MemberMenu from './member-menu.vue'
import SearchBar from './search-bar.vue'
import SearchPanel from './search-panel.vue'
import MobileDrawer from './mobile-drawer.vue'
import MenuDialog from './menu-dialog.vue'
import ThemePanel from './theme-panel.vue'
import type { NavChild, NavEntry } from './mobile-drawer.vue'

const route = useRoute()

/**
 * 注水一致门控：头部扩展动作 / 语言切换依赖客户端 init 插件（init-site.client.ts）
 * 填充的 store，SSR 阶段恒为空而注水时已就绪，直接渲染会产生结构性 hydration
 * mismatch。以 mounted 门控延迟到挂载后渲染：SSR 输出本就为空，视觉零回归。
 */
const mounted = ref(false)
onMounted(() => {
    mounted.value = true
})

/**
 * 首屏防晃动内联脚本（bodyClose，文档解析尾、首次绘制前执行）：
 * SSR 直出为全量导航，若等注水后才收纳会先画「全宽溢出」再跳成「更多」，产生闪跳。
 * 此脚本在首绘前同步测量并隐藏溢出项、点亮「更多」；幂等设计（重复执行时溢出项
 * 已隐藏、宽度和必然不超容器，直接早退），注水/客户端重放均无副作用。
 */
useHead({
    script: [
        {
            key: 'md-nav-collapse',
            tagPosition: 'bodyClose',
            innerHTML: `(function () {
                var nav = document.getElementById('site-nav');
                if (!nav) return;
                var items = nav.querySelectorAll('.nav-item-wrap');
                if (!items.length) return;
                var avail = nav.clientWidth;
                if (avail <= 0) return;
                var MORE_W = 76;
                var used = 0, count = items.length, i, w;
                for (i = 0; i < items.length; i++) {
                    used += items[i].offsetWidth;
                    if (used > avail) break;
                }
                if (i === items.length) return;
                used = 0; count = 0;
                for (i = 0; i < items.length; i++) {
                    w = items[i].offsetWidth;
                    if (used + w <= avail - MORE_W) { used += w; count++; } else break;
                }
                for (i = count; i < items.length; i++) items[i].style.display = 'none';
                var more = nav.querySelector('[data-nav-more]');
                if (more) more.style.display = '';
                window.__MD_NAV_COUNT = count;
            })();`,
        },
    ],
})

// 文档阅读页（/docs/:name[/id]）：Header 内容区放开最大宽度（全宽贴边，与左侧栏/右侧目录
// 的贴边布局对齐），底部分隔线与所有页面保持一致；其余页面维持 1250px 居中
const isDocReader = computed(() => /^\/docs\/.+/.test(route.path))
// 主导航显隐开关：route.meta.site_nav === false 隐藏（对齐 default.vue 的 portal_footer 模式）
const showNav = computed(() => route.meta.site_nav !== false)
// 导航数据 SSR 直出：完全以 web 后台菜单管理（md_web_menu）为准（useNav 内按登录态响应式过滤）
const { data: navData } = useNav()
// 布局层已 await 同一 key，直接消费 SSR 站点配置（站名 / Logo）
const { data: siteCfg } = useSiteConfig()
const cfg = computed(() => siteCfg.value!)

// 私有空间 Logo 占位门控：SSR 不输出直链（签名地址进 HTML 会被缓存/抓取，存在盗刷与流量浪费风险），
// 首屏按站点配置渲染品牌占位；computed 内先触发批量换取（内部按缓存/节流去重），
// 签名就绪后 pending 翻转渲染真实 Logo，换取失败保持占位、不产生裸链请求
const logoPending = computed(() => {
    const logo = (cfg.value.site_logo || '').trim()
    if (logo === '') return false
    resolveSignedUrl(logo)
    return isPrivateResourcePending(logo)
})
const memberStore = useMemberStore()
const configStore = useConfigStore()

// ====== 滚动联动（框架 el-scrollbar 注入模式）：滚动后毛玻璃加深 ======
const mainScrollbarRef = inject<any>('mainScrollbarRef', ref(null))
const isScrolled = ref(false)
let scrollWrap: HTMLElement | null = null

function onWrapScroll() {
    isScrolled.value = !!scrollWrap && scrollWrap.scrollTop > 0
}

function bindScrollWrap() {
    const wrap = (mainScrollbarRef?.value as any)?.wrapRef as HTMLElement | undefined
    if (wrap && wrap !== scrollWrap) {
        if (scrollWrap) scrollWrap.removeEventListener('scroll', onWrapScroll)
        scrollWrap = wrap
        scrollWrap.addEventListener('scroll', onWrapScroll, { passive: true })
        onWrapScroll()
    }
}

onMounted(bindScrollWrap)
watch(mainScrollbarRef, () => nextTick(bindScrollWrap))
onBeforeUnmount(() => {
    scrollWrap?.removeEventListener('scroll', onWrapScroll)
    scrollWrap = null
})

/** web_menu 菜单项 → 导航条目（递归整棵菜单树，active_prefix 命中即高亮；空数组按 url 等值判定）
 *  根路径前缀 '/' 特判精确匹配：startsWith('/') 会命中全站路由导致「首页」常亮 */
function toNavChild(m: NavMenuItem): NavChild {
    const hit = (pfx: string) => (pfx === '/' ? route.path === '/' : route.path.startsWith(pfx))
    return {
        label: m.name,
        to: m.url,
        external: m.external,
        active: m.active_prefix.length
            ? m.active_prefix.some(hit)
            : route.path === m.url,
        children: m.children?.length ? m.children.map(toNavChild) : null,
    }
}

/** 主导航条目：web_menu category=1 树（外链/目录下拉/内部页统一结构） */
const entries = computed<NavEntry[]>(() =>
    (navData.value?.menus ?? []).map((m, i) => ({ key: `menu-${i}-${m.url}`, ...toNavChild(m) })),
)

// ====== 桌面端导航溢出收纳（ResizeObserver 实测宽度，溢出项收入「更多」） ======
const navEl = ref<HTMLElement | null>(null)
// 普通数组承载真实 DOM 引用，无需响应式
const itemEls: (HTMLElement | null)[] = []
// 可完整展示的条目数：SSR 全量渲染供内联脚本测量；客户端初始值优先复用脚本
// 在首绘前算好的收纳结果（window.__MD_NAV_COUNT），注水前后 DOM 一致零晃动；
// 脚本在容器宽度未就绪（≈0，布局切换/重挂载窗口期）时会写入 0，视为「未测量」
// 而非「全部溢出」，回退全量渲染并交给 recomputeNav 实测收敛
const initialNavCount = import.meta.client
    ? (window as { __MD_NAV_COUNT?: number }).__MD_NAV_COUNT
    : undefined
const visibleCount = ref(
    typeof initialNavCount === 'number' && initialNavCount > 0 ? initialNavCount : 999,
)
const overflowEntries = computed(() =>
    entries.value.slice(Math.min(visibleCount.value, entries.value.length)),
)
// 「更多」面板行：溢出项及其各级子栏目按层级缩进平铺
const overflowRows = computed<{ row: NavChild; depth: number }[]>(() => {
    const rows: { row: NavChild; depth: number }[] = []
    const walk = (list: NavChild[] | null, depth: number) => {
        for (const it of list ?? []) {
            rows.push({ row: it, depth })
            if (it.children?.length) walk(it.children, depth + 1)
        }
    }
    walk(overflowEntries.value, 0)
    return rows
})
// 当前命中的导航项被收纳时，「更多」按钮同步高亮（active 已含子孙联动）
const overflowActive = computed(() =>
    overflowEntries.value.some((e) => e.active),
)

let resizeObserver: ResizeObserver | null = null

async function recomputeNav() {
    if (!import.meta.client || !navEl.value) return
    // 先放开全部条目，同步强制布局读取真实宽度，再按宽度收敛（同帧完成无闪烁）
    visibleCount.value = entries.value.length
    await nextTick()
    const nav = navEl.value
    if (!nav) return
    const navWidth = nav.clientWidth
    // 容器宽度未就绪（布局切换/重挂载瞬间的 ≈0 宽度）无法实测，
    // 保持现状（初始为全量渲染）并等 ResizeObserver 在真实宽度下重算
    if (navWidth <= 0) return
    const total = entries.value.length
    if (!total) {
        visibleCount.value = 0
        return
    }
    const widths: number[] = []
    let usedWidth = 0
    let fitAll = true
    for (let i = 0; i < total; i++) {
        const w = itemEls[i]?.offsetWidth ?? 0
        widths.push(w)
        usedWidth += w
        if (usedWidth > navWidth) fitAll = false
    }
    if (fitAll) {
        visibleCount.value = total
        return
    }
    // 存在溢出：为「更多」按钮预留宽度
    const MORE_BUTTON_WIDTH = 76
    usedWidth = 0
    let count = 0
    for (let i = 0; i < total; i++) {
        if (usedWidth + (widths[i] ?? 0) <= navWidth - MORE_BUTTON_WIDTH) {
            usedWidth += widths[i] ?? 0
            count += 1
        } else {
            break
        }
    }
    visibleCount.value = count
}

onMounted(() => {
    recomputeNav()
    if (navEl.value && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => recomputeNav())
        resizeObserver.observe(navEl.value)
    }
    // 字体异步加载会改变文字实测宽度，就绪后校准一次
    document.fonts?.ready.then(() => recomputeNav()).catch(() => {})
})

onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
})

// 导航数据异步就绪或显隐/名称变化后重新计算
watch(entries, () => recomputeNav(), { flush: 'post' })
// 导航显隐切换（meta.site_nav）后重算一次：v-if 重建 DOM，宽度测量需重跑
watch(showNav, () => nextTick(recomputeNav), { flush: 'post' })

// ====== 未读徽章（notify-provider 注册表驱动：count=数字徽章 / dot=红点提示） ======
const { totalUnread, hasDotUnread, badgeForUrl, dotForUrl } = useMemberBadges()
/** 头像总未读徽章文本（count 模式合计，0 隐藏，>99 显示 99+） */
const formatBadge = (n: number): string => (n > 0 ? (n > 99 ? '99+' : String(n)) : '')
const totalUnreadBadge = computed(() => formatBadge(totalUnread.value))

// ====== 多语言（沿用框架语言能力） ======
const systemStore = useSystemStore()
const availableLanguages = computed(() => systemStore.getLanguages)
const currentLanguage = computed(() => systemStore.lang)
const langEnabled = computed(() => configStore.language.is_enabled && availableLanguages.value.length > 1)

function handleLanguageChange(lang: string) {
    systemStore.setLanguage(lang)
}

// ====== 头部扩展动作（web_menu category=3，通知/私信已并入头像下拉不重复渲染） ======
const { actions, actionKey, badgeCount, handleClick } = useHeaderActions()
const extraActions = computed(() => actions.value.filter((m) => !isMergedUnreadAction(m.path)))

// ====== 头像下拉/移动抽屉会员菜单（web_menu category=2，useNav 已按登录态响应式过滤） ======
// 可见性 = 后端 is_public/is_no_auth/code 三层语义 + useNav 登录态过滤，前端仅叠加会员套餐业务开关
const memberMenus = computed<NavMenuItem[]>(() => navData.value?.member_menus ?? [])
const memberItems = computed<NavMenuItem[]>(() => filterMemberTree(memberMenus.value, cfg.value?.membership_enabled))
/** 移动端抽屉扁平行（目录=分组标题缩进平铺） */
const memberRows = computed(() => flattenMemberRows(memberItems.value, badgeForUrl, dotForUrl))

// ====== 移动端抽屉 ======
const mobileOpen = ref(false)

// 登录/退出动作完成后收起抽屉
function onMobileLogin() {
    mobileOpen.value = false
    memberStore.logOpen()
}

function onMobileLogout() {
    mobileOpen.value = false
    memberStore.logout('/')
}
</script>

<style scoped>
/* 桌面端顶级导航：底部下划线选中态 */
.nav-top-link {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 14px;
    font-size: 15px;
    white-space: nowrap;
    color: var(--md-text-2);
    transition: color 0.2s ease;
}

.nav-top-link::after {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 0;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: var(--md-primary);
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.2s ease;
}

.nav-top-link:hover {
    color: var(--md-primary);
}

.nav-top-link-active,
.nav-top-link-active:hover {
    color: var(--md-primary);
    font-weight: 500;
}

.nav-top-link-active::after {
    transform: scaleX(1);
}

/* 滚动后毛玻璃加深（框架 el-scrollbar scrollTop 联动）：
   背景取主题变量，暗黑下与导航栏/搜索栏同源，禁止硬编码白色 */
.is-scrolled {
    background: var(--md-header-bg-scrolled);
    box-shadow: 0 1px 10px rgba(31, 35, 41, 0.06);
}

html.dark .is-scrolled {
    box-shadow: 0 1px 10px rgba(0, 0, 0, 0.35);
}

/* ===== 头像未读闪烁标识：右下角实心点 + 扩散光圈（呼吸闪烁）=====
 * 纯 CSS 动画 + pointer-events:none，不阻塞头像按钮交互；减弱动态效果偏好下停用光圈。
 */
.md-unread-dot {
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

.md-unread-dot::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--el-color-danger);
    animation: md-unread-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes md-unread-ping {
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
    .md-unread-dot::before {
        animation: none;
        opacity: 0;
    }
}

/* 头部扩展动作徽章贴合 */
.header-action-badge {
    display: flex;
    align-items: center;
}

:deep(.header-action-badge .el-badge__content) {
    border: none;
    box-shadow: 0 0 0 1px var(--md-bg);
}
</style>
