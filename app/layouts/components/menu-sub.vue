<template>
    <div v-for="(item, idx) in props.menus" :key="idx">
        <el-sub-menu v-if="systemStore.hasChildren(item) && checkMenuShow(item)" :index="`column-${item.id}`">
            <template #title>
                <Icon v-if="showIcon && item.icon" :icon="item.icon" color="var(--el-text-color-primary)" />
                {{ item.title }}
            </template>
            <MenuSub :menus="item.children" :show-icon="showIcon" @menu-click="$emit('menu-click')" />
        </el-sub-menu>
        <el-menu-item 
            v-else-if="checkMenuShow(item)"
            @click="onClickMenu(item)" 
            :index="'column-' + item.id" 
            :class="item.name.replace(/[\/]/g, '-')"
        >
            <Icon v-if="showIcon && item.icon" :icon="item.icon" color="var(--el-text-color-primary)" />
            <template #title>{{ item.title }}</template>
        </el-menu-item>
    </div>
</template>

<script setup lang="ts">
import type { Menus } from '~/stores/interface'
import { navigateTo } from 'nuxt/app'
import { useSystemStore } from '~/stores/system'
import { Icon } from '~/components/icon'

interface Props {
    menus: Menus[]
    showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    menus: () => [],
    showIcon: false,
})

const emit = defineEmits<{
    'menu-click': []
}>()

const systemStore = useSystemStore()

const checkMenuShow = (menu: Menus): boolean => {
    if (!menu) {
        return false
    }
    
    const permissions = menu.meta?.permissions
    
    if (!permissions || permissions.length === 0) {
        return true
    }
    
    return systemStore.checkMenuPermission(menu)
}

const onClickMenu = (menu: Menus) => {
    // 检查权限
    if (!systemStore.checkMenuPermission(menu)) {
        return
    }

    if (systemStore.isDirectory(menu)) {
        return
    }

    // 先触发菜单点击事件，关闭弹窗
    emit('menu-click')

    if (systemStore.isExternalLink(menu)) {
        const target = systemStore.getTarget(menu)
        if (menu.url) {
            window.open(menu.url, target)
        }
        return
    }

    if (menu.path) {
        navigateTo(menu.path)
    }
}
</script>

<style scoped lang="scss">
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
</style>
