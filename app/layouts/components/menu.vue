<template>
    <el-menu :default-active="state.activeMenu" @select="onSelect">
        <MenuSub :menus="systemStore.navMenu" :show-icon="showIcon" @menu-click="$emit('menu-click')" />
    </el-menu>
</template>

<script setup lang="ts">
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { Menus } from '~/stores/interface'
import { reactive, nextTick, watch } from 'vue'
import { useRoute, navigateTo } from 'nuxt/app'
import { useSystemStore } from '~/stores/system'
import { useI18n } from 'vue-i18n'
import MenuSub from './menu-sub.vue'

const route = useRoute()
const systemStore = useSystemStore()
const { t } = useI18n()

interface Props {
    showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showIcon: false,
})

const emit = defineEmits<{
    'menu-click': []
}>()

const state = reactive({
    activeMenu: '',
    switchingLanguage: false,
})

const setActiveMenu = (route: RouteLocationNormalizedLoaded) => {
    if (route.path == '/') return (state.activeMenu = 'index')

    const menuId = findMenus(route)
    if (menuId) {
        state.activeMenu = 'column-' + menuId
    } else if (route.path.startsWith('/user')) {
        state.activeMenu = 'user'
    }
}

const onSelect = (index: string) => {
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
    if (!systemStore.navMenu || !Array.isArray(systemStore.navMenu)) {
        return false
    }
    
    const headNavIndex = searchMenuIndex(systemStore.navMenu, route)
    if (headNavIndex !== false) return headNavIndex
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
</style>
