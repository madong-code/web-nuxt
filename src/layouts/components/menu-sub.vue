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
            :class="getMenuItemClass(item)"
            :data-menu-id="item.id"
            :data-menu-name="item.name"
            :data-menu-path="item.path"
            :data-menu-controllable="item.extra?.controllable ? 'true' : undefined"
        >
            <Icon v-if="showIcon && item.icon" :icon="item.icon" color="var(--el-text-color-primary)" />
            <template #title>
                <span class="menu-title">{{ item.title }}</span>
                <!-- 徽章 -->
                <span
                    v-if="item.extra?.badge"
                    class="menu-badge"
                    :class="[`badge-${item.extra?.badgeType || 'danger'}`]"
                    :data-badge="item.extra.badge"
                >
                    {{ item.extra.badge }}
                </span>
                <!-- 红点（仅显示状态无数量时） -->
                <span
                    v-else-if="item.extra?.badge === '' || item.extra?.dot"
                    class="menu-dot"
                    :class="[`dot-${item.extra?.badgeType || 'danger'}`]"
                ></span>
            </template>
        </el-menu-item>
    </div>
</template>

<script setup lang="ts">
import type { Menus } from '~/stores/interface'
import { navigateTo } from 'nuxt/app'
import { useSystemStore } from '~/stores/system'
import { Icon } from '~/components/icon'
import { onMounted, onUnmounted } from 'vue'

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

// 组件挂载后，如果有可操控菜单，触发事件通知外部
onMounted(() => {
    const hasControllable = props.menus.some(item => item.extra?.controllable)
    if (hasControllable) {
        window.dispatchEvent(new CustomEvent('menu:controllable:mounted'))
    }
})

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

/**
 * 获取菜单项的 CSS 类名
 * - 提供可操作的 DOM 标识
 */
const getMenuItemClass = (item: Menus): string => {
    const classes: string[] = []

    // 基础类：根据 name 生成（保留中文，仅替换特殊字符）
    if (item.name) {
        const baseClass = item.name.replace(/[^\w\u4e00-\u9fa5\-]/g, '-')
        if (baseClass) classes.push(`menu-${baseClass}`)
    }

    // 可操控菜单标识（通过 extra.controllable）
    if (item.extra?.controllable) {
        classes.push('menu-controllable')
    }

    // 有徽章时的特殊类
    if (item.extra?.badge || item.extra?.dot) {
        classes.push('has-badge')
    }

    return classes.join(' ')
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

// 菜单标题
.menu-title {
    flex: 1;
}

// 徽章样式
.menu-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 9px;
    margin-left: 6px;
    flex-shrink: 0;

    // 颜色变体
    &.badge-danger {
        background-color: var(--el-color-danger);
        color: #fff;
    }

    &.badge-warning {
        background-color: var(--el-color-warning);
        color: #fff;
    }

    &.badge-success {
        background-color: var(--el-color-success);
        color: #fff;
    }

    &.badge-info {
        background-color: var(--el-color-info);
        color: #fff;
    }

    &.badge-primary {
        background-color: var(--el-color-primary);
        color: #fff;
    }
}

// 红点样式
.menu-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: 6px;
    flex-shrink: 0;

    &.dot-danger {
        background-color: var(--el-color-danger);
    }

    &.dot-warning {
        background-color: var(--el-color-warning);
    }

    &.dot-success {
        background-color: var(--el-color-success);
    }

    &.dot-info {
        background-color: var(--el-color-info);
    }

    &.dot-primary {
        background-color: var(--el-color-primary);
    }
}

// 可操控菜单特殊样式（如通知菜单）
:deep(.menu-controllable) {
    position: relative;

    .menu-badge,
    .menu-dot {
        animation: pulse 2s infinite;
    }
}

// 脉冲动画
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}

// 有徽章的菜单项高亮
:deep(.has-badge) {
    .menu-title {
        font-weight: 500;
    }
}
</style>
