<template>
    <nav class="member-nav">
        <div class="member-nav__inner">
            <!-- 一级：分组导航（B站空间式横向 Tab + 下划线指示） -->
            <div class="member-nav__tabs">
                <button
                    v-for="group in visibleMenus"
                    :key="group.id"
                    type="button"
                    class="member-nav__tab"
                    :class="{ 'is-active': activeGroup && group.id === activeGroup.id }"
                    @click="goGroup(group)"
                >
                    <Icon v-if="group.icon" :icon="group.icon" size="16" />
                    <span>{{ group.title }}</span>
                </button>
            </div>
            <!-- 二级：当前分组的子页面胶囊 -->
            <div v-if="activeGroupChildren.length" class="member-nav__pills">
                <button
                    v-for="menu in activeGroupChildren"
                    :key="menu.id"
                    type="button"
                    class="member-nav__pill"
                    :class="{ 'is-active': menu.path === route.path }"
                    @click="go(menu)"
                >
                    <Icon v-if="menu.icon" :icon="menu.icon" size="14" />
                    <span>{{ menu.title }}</span>
                </button>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import type { Menus } from '~/stores/interface'
import { useSystemStore } from '~/stores/system'
import { useRoute, navigateTo } from 'nuxt/app'
import { computed } from 'vue'
import { Icon } from '~/components/icon'

const route = useRoute()
const systemStore = useSystemStore()

const checkMenuShow = (menu: Menus): boolean => {
    if (!menu) {
        return false
    }

    const permissions = menu.meta?.permissions

    if (!permissions || permissions.length === 0) {
        return true
    }

    const result = systemStore.checkMenuPermission(menu)
    return result
}

// 可见的顶级菜单（分组）
const visibleMenus = computed<Menus[]>(() => {
    return (systemStore.site.member_menu || []).filter((menu: Menus) => checkMenuShow(menu))
})

// 当前路由所在的分组
const activeGroup = computed(() => {
    const path = route.path
    return visibleMenus.value.find(
        (group: Menus) => (group.children || []).some((child: Menus) => child && checkMenuShow(child) && child.path === path)
    )
})

// 当前分组的可见子页面
const activeGroupChildren = computed<Menus[]>(() => {
    if (!activeGroup.value) {
        return []
    }
    return (activeGroup.value.children || []).filter((child: Menus) => child && checkMenuShow(child))
})

/**
 * 菜单跳转（处理目录/外链/内部路由）
 */
const go = (menu: Menus) => {
    if (systemStore.isDirectory(menu)) {
        return
    }

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

/**
 * 点击分组：跳转到其第一个可见子页面
 */
const goGroup = (group: Menus) => {
    const children = (group.children || []).filter((child: Menus) => child && checkMenuShow(child))
    go(children.length ? children[0] : group)
}
</script>

<style scoped lang="scss">
.member-nav {
    position: sticky;
    top: 0;
    z-index: 30;
    background: color-mix(in srgb, var(--el-bg-color) 82%, transparent);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .member-nav__inner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
    }
}

.member-nav__tabs {
    display: flex;
    align-items: center;
    gap: 30px;

    .member-nav__tab {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 15px 2px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 15px;
        font-weight: 600;
        font-family: inherit;
        color: var(--el-text-color-regular);
        white-space: nowrap;
        transition: color 0.2s ease;

        &:hover {
            color: var(--el-text-color-primary);
        }

        &.is-active {
            color: var(--el-color-primary);

            // 下划线指示条
            &::after {
                content: '';
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 2px;
                border-radius: 2px 2px 0 0;
                background-color: var(--el-color-primary);
            }
        }
    }
}

.member-nav__pills {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 2px 0 14px;

    .member-nav__pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 32px;
        padding: 0 14px;
        border: 1px solid transparent;
        border-radius: 999px;
        background-color: var(--el-fill-color);
        cursor: pointer;
        font-size: 13px;
        font-family: inherit;
        color: var(--el-text-color-regular);
        white-space: nowrap;
        transition: all 0.2s ease;

        &:hover {
            color: var(--el-color-primary);
            background-color: var(--el-color-primary-light-9);
        }

        &.is-active {
            background-color: var(--el-color-primary-light-9);
            border-color: var(--el-color-primary-light-7);
            color: var(--el-color-primary);
            font-weight: 600;
        }
    }
}

/* 响应式：小屏横向滚动 */
@media screen and (max-width: 991px) {
    .member-nav__tabs {
        gap: 22px;
        overflow-x: auto;
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }
    }

    .member-nav__pills {
        flex-wrap: nowrap;
        overflow-x: auto;
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }
    }
}
</style>
