<template>
    <template v-for="(item, idx) in props.menus" :key="idx">
        <!-- 有 children → el-sub-menu -->
        <el-sub-menu
            v-if="systemStore.hasChildren(item) && checkMenuShow(item)"
            :index="`column-${item.id}`"
            :teleported="teleported"
            :popper-class="popperClass"
        >
            <template #title>
                <Icon v-if="showIcon && item.icon" :icon="item.icon" color="var(--el-text-color-primary)" />
                {{ item.title }}
            </template>
            <MenuSub
                :menus="item.children || []"
                :show-icon="showIcon"
                :teleported="teleported"
                @menu-click="$emit('menu-click')"
            />
        </el-sub-menu>

        <!-- 无 children 的普通菜单项 -->
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
    </template>
</template>

<script setup lang="ts">
import type { Menus } from '~/stores/interface'
import { navigateTo } from 'nuxt/app'
import { useSystemStore } from '~/stores/system'
import { useMemberStore } from '~/stores/member'
import { Icon } from '~/components/icon'
import { onMounted, onUnmounted } from 'vue'

interface Props {
    menus: Menus[]
    showIcon?: boolean
    /**
     * 是否将子菜单的弹出层 teleport 到 body
     * 默认 true，保持兼容已有行为
     */
    teleported?: boolean
    /** 子菜单弹出层的自定义 class */
    popperClass?: string
}

const props = withDefaults(defineProps<Props>(), {
    menus: () => [],
    showIcon: false,
    teleported: true,
    popperClass: '',
})

const emit = defineEmits<{
    'menu-click': []
}>()

const systemStore = useSystemStore()
const memberStore = useMemberStore()

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

    // 公开菜单（is_public 默认 true）→ 始终显示
    const isPublic = menu.meta?.is_public !== false
        && menu.meta?.is_public !== 0
        && menu.meta?.is_public !== '0'

    if (isPublic) {
        return true
    }

    // 非公开菜单 → 必须登录才显示
    if (!memberStore.info) {
        return false
    }

    // 已登录 → 使用统一的权限检查（包含 code + permissions）
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
::deep(.menu-controllable) {
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
::deep(.has-badge) {
    .menu-title {
        font-weight: 500;
    }
}
</style>
