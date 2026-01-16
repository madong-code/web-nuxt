<template>
    <el-menu :default-active="state.activeMenu" @select="onSelect">
        <el-menu-item @click="handleClick('/')" v-blur index="index">
            <Icon v-if="props.showIcon" name="fa fa-home" color="var(--el-text-color-primary)" />
            <template #title>{{ t('主页') }}</template>
        </el-menu-item>

        <!-- 动态菜单 -->
        <MenuSub :menus="systemStore.site.head_nav" :show-icon="showIcon" />
    </el-menu>
</template>

<script setup lang="ts">
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { Menus } from '~/stores/interface'
import MenuSub from './menu-sub.vue'

const route = useRoute()
const systemStore = useSystemStore()

interface Props {
    showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showIcon: false,
})

const state = reactive({
    activeMenu: '',
    switchingLanguage: false,
})

/**
 * 设置激活菜单
 */
const setActiveMenu = (route: RouteLocationNormalizedLoaded) => {
    if (route.path == '/') return (state.activeMenu = 'index')

    const menuId = findMenus(route)
    if (menuId) {
        state.activeMenu = 'column-' + menuId
    } else if (route.path.startsWith('/user')) {
        state.activeMenu = 'user'
    }
}

/**
 * 菜单被点击时额外对无需激活的菜单处理（外链、暗黑模式开关、语言切换等）
 * 检查菜单是否需要激活，如果否，还原 state.activeMenu
 */
const onSelect = (index: string) => {
    if (noNeedActive(systemStore.site.head_nav, index)) {
        const oldActiveMenu = state.activeMenu
        state.activeMenu = ''
        nextTick(() => {
            state.activeMenu = oldActiveMenu
        })
    }
}

/**
 * 检查一个菜单是否需要激活态
 * @param menus
 * @param index
 */
const noNeedActive = (menus: Menus[], index: string) => {
    if (index.indexOf('language-switch') === 0 || index == 'theme-switch') {
        return true
    }
    return isExternalLink(menus, index)
}

/**
 * 检查一个菜单是否是外站链接，如果是，不要激活
 * @param menus
 * @param index
 */
const isExternalLink = (menus: Menus[], index: string): boolean => {
    // 修复：添加空值检查
    if (!menus || !Array.isArray(menus)) {
        return false
    }
    
    for (const key in menus) {
        // 修复：检查 menus[key] 是否存在
        if (!menus[key]) continue
        
        const columnIndex = `column-${menus[key].id}`
        if (columnIndex == index) {
            return menus[key].meta?.menu_type == 'link'
        }
        // 修复：添加 children 存在性检查
        if (menus[key].children && Array.isArray(menus[key].children) && menus[key].children.length) {
            const result = isExternalLink(menus[key].children, index)
            if (result) return true
        }
    }
    return false
}

/**
 * 递归的搜索菜单 Index
 */
const searchMenuIndex = (menus: Menus[], route: RouteLocationNormalizedLoaded): number | false => {
    // 修复：添加空值检查
    if (!menus || !Array.isArray(menus)) {
        return false
    }
    
    let find: boolean | number = false
    for (const key in menus) {
        // 修复：检查 menus[key] 是否存在
        if (!menus[key]) continue
        
        if (menus[key].id && menus[key].path == route.fullPath) {
            return menus[key].id
        }
        if (menus[key].children && Array.isArray(menus[key].children) && menus[key].children.length) {
            find = searchMenuIndex(menus[key].children, route)
            if (find !== false) return find
        }
    }
    return find
}

const handleClick = (path: string) => {
    navigateTo(path)
}

/**
 * 从动态菜单中-搜索一个菜单
 */
const findMenus = (route: RouteLocationNormalizedLoaded) => {
    // 修复：添加空值检查
    if (!systemStore.site.head_nav || !Array.isArray(systemStore.site.head_nav)) {
        return false
    }
    
    const headNavIndex = searchMenuIndex(systemStore.site.head_nav, route)
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