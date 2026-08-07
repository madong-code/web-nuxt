<template>
    <el-menu :default-active="state.activeMenu" :mode="mode" @select="onSelect">
        <!-- 移动端（垂直模式）：直接展示全部菜单，不做溢出拆分 -->
        <template v-if="isVertical">
            <MenuSub :menus="systemStore.navMenu" :show-icon="showIcon" @menu-click="$emit('menu-click')" :key="navMenuKey" />
        </template>
        <!-- PC端（水平模式）：固定显示 + 溢出"更多" -->
        <template v-else>
            <MenuSub :menus="systemStore.visibleNavMenu" :show-icon="showIcon" @menu-click="$emit('menu-click')" :key="navMenuKey" />
            <el-sub-menu
                v-if="hasOverflow"
                index="overflow-more"
                class="overflow-more-menu"
                :popper-offset="12"
            >
                <template #title>
                    <Icon icon="mdi:dots-horizontal" color="var(--el-text-color-primary)" />
                    {{ t('common.more') || '更多' }}
                </template>
                <MenuSub :menus="systemStore.overflowNavMenu" :show-icon="showIcon" @menu-click="$emit('menu-click')" />
            </el-sub-menu>
        </template>
    </el-menu>
</template>

<script setup lang="ts">
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { Menus } from '~/stores/interface'
import { reactive, computed, nextTick, watch } from 'vue'
import { useRoute, navigateTo } from 'nuxt/app'
import { useSystemStore } from '~/stores/system'
import { useI18n } from 'vue-i18n'
import { Icon } from '~/components/icon'
import MenuSub from './menu-sub.vue'

const route = useRoute()
const systemStore = useSystemStore()
const { t } = useI18n()

interface Props {
    showIcon?: boolean
    mode?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<Props>(), {
    showIcon: false,
    mode: 'horizontal',
})

/** 是否为垂直布局（移动端侧边抽屉） */
const isVertical = computed(() => props.mode === 'vertical')

const emit = defineEmits<{
    'menu-click': []
}>()

const state = reactive({
    activeMenu: '',
    switchingLanguage: false,
})

// 是否有溢出菜单
const hasOverflow = computed(() => systemStore.overflowNavMenu.length > 0)

// 调试用：检查 navMenu 中是否有消息中心
const navMenuKey = computed(() => {
    const hasNotify = systemStore.visibleNavMenu?.some((m: Menus) => m.name === '消息中心' || m.path === '/notify')
    import.meta.env.DEV && console.log('[Menu] visibleNavMenu has 消息中心:', hasNotify, 'menus:', systemStore.visibleNavMenu?.map((m: Menus) => m.name))
    return hasNotify ? 'with-notify' : 'no-notify'
})

const setActiveMenu = (route: RouteLocationNormalizedLoaded) => {
    if (route.path == '/') return (state.activeMenu = 'index')

    // 同时在可见菜单和溢出菜单中搜索
    const menuId = findMenus(route)
    if (menuId) {
        state.activeMenu = 'column-' + menuId
    } else if (route.path.startsWith('/user')) {
        state.activeMenu = 'user'
    }
}

const onSelect = (index: string) => {
    // "更多"节点不需要高亮保持
    if (index === 'overflow-more') return

    if (noNeedActive(systemStore.headNav, index)) {
        const oldActiveMenu = state.activeMenu
        state.activeMenu = ''
        nextTick(() => {
            state.activeMenu = oldActiveMenu
        })
    }
}

const noNeedActive = (menus: Menus[], index: string) => {
    if (index.indexOf('language-switch') === 0 || index == 'theme-switch') {
        return true
    }
    return isExternalLink(menus, index)
}

const isExternalLink = (menus: Menus[], index: string): boolean => {
    if (!menus || !Array.isArray(menus)) {
        return false
    }
    
    for (const menu of menus) {
        if (!menu) continue
        
        const columnIndex = `column-${menu.id}`
        if (columnIndex == index) {
            return systemStore.isExternalLink(menu)
        }
        if (menu.children && Array.isArray(menu.children) && menu.children.length) {
            const result = isExternalLink(menu.children, index)
            if (result) return true
        }
    }
    return false
}

const searchMenuIndex = (menus: Menus[], route: RouteLocationNormalizedLoaded): number | false => {
    if (!menus || !Array.isArray(menus)) {
        return false
    }
    
    let find: boolean | number = false
    for (const menu of menus) {
        if (!menu) continue
        
        if (menu.id && menu.path == route.fullPath) {
            return menu.id
        }
        if (menu.children && Array.isArray(menu.children) && menu.children.length) {
            find = searchMenuIndex(menu.children, route)
            if (find !== false) return find
        }
    }
    return find
}

const handleClick = (path: string) => {
    navigateTo(path)
}

const findMenus = (route: RouteLocationNormalizedLoaded) => {
    // 移动端：直接在全部菜单中搜索
    if (isVertical.value) {
        const index = searchMenuIndex(systemStore.navMenu, route)
        return index !== false ? index : false
    }

    // PC端：优先在可见菜单中搜索，再在溢出菜单中搜索
    const visibleIndex = searchMenuIndex(systemStore.visibleNavMenu, route)
    if (visibleIndex !== false) return visibleIndex

    const overflowIndex = searchMenuIndex(systemStore.overflowNavMenu, route)
    if (overflowIndex !== false) return overflowIndex

    return false
}

setActiveMenu(route)
watch(
    () => route.fullPath,
    () => {
        setActiveMenu(route)
    }
)
</script>

<style scoped lang="scss">
.header-user-box {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    .header-user-avatar {
        width: 16px;
        height: 16px;
        margin-right: 4px;
        border-radius: 50%;
    }
    .icon-header-user-avatar {
        margin-left: 4px;
        margin-right: 6px;
    }
}
.el-sub-menu .icon,
.el-menu-item .icon {
    vertical-align: middle;
    margin-right: 2px;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
}
.is-active > .icon {
    color: var(--el-menu-active-color) !important;
}
.el-menu {
    border-bottom: none;
    border-right: none;
    .theme-switch.is-active,
    .language-switch.is-active {
        border-bottom: none;
        :deep(.el-sub-menu__title) {
            border-bottom: none;
        }
    }
}
.theme-switch {
    --el-menu-hover-bg-color: none;
    padding-right: 0;
}
.vertical-theme-switch {
    .theme-toggle-content {
        padding: 0;
    }
}
.theme-toggle-content {
    padding-right: 0;
}

// 水平导航菜单：缩小菜单项左右内边距（默认过宽，单页最多六个菜单）
.el-menu--horizontal {
    :deep(> .el-menu-item),
    :deep(> .el-sub-menu > .el-sub-menu__title) {
        padding: 0 12px;
    }
}

// "更多"溢出菜单样式
.overflow-more-menu {
    :deep(.el-sub-menu__title) {
        display: flex;
        align-items: center;
    }
}
</style>
