<template>
    <!--
        会员菜单递归渲染（头像下拉等挂载点共用）：
        - 页面节点（有 url）：图标 + 名称 + 未读徽章，NuxtLink 跳转
        - 目录节点（无 url）：行内 ChevronRight，hover 向左弹出子级面板
          （头像下拉右锚定屏幕右缘，子级统一向左展开避免溢出视口）
        - 可见性由父级负责（后端三类过滤 + membership 业务开关），组件内不再过滤
    -->
    <div class="member-menu-root">
        <template v-for="(item, i) in items" :key="`${depth}-${i}-${item.url || item.name}`">
        <!-- 目录节点：hover 弹出子菜单（DOM 嵌套在父下拉内，hover 链不断） -->
        <div v-if="!item.url" class="member-menu-group">
            <div
                class="member-menu-row member-menu-dir"
                :class="{ 'member-menu-dir-active': groupActive(item) }"
            >
                <component :is="resolveMemberIcon(item.icon)" class="member-menu-icon" />
                <span class="flex-1 truncate">{{ item.name }}</span>
                <ChevronRight class="w-3.5 h-3.5 opacity-50 shrink-0" />
            </div>
            <div class="member-menu-flyout">
                <div class="member-menu-panel">
                    <MemberMenu :items="item.children ?? []" :depth="depth + 1" />
                </div>
            </div>
        </div>
        <!-- 页面节点 -->
        <NuxtLink
            v-else
            :to="item.url"
            :target="item.external ? '_blank' : undefined"
            :rel="item.external ? 'noopener' : undefined"
            class="member-menu-row"
            :class="{ 'member-menu-row-active': itemActive(item.url) }"
        >
            <span class="relative flex items-center shrink-0">
                <component :is="resolveMemberIcon(item.icon)" class="member-menu-icon" />
                <span v-if="badgeForUrl(item.url)" class="md-menu-badge">{{ badgeForUrl(item.url) }}</span>
                <span v-else-if="dotForUrl(item.url)" class="md-menu-dot"></span>
            </span>
            <span class="flex-1 truncate">{{ item.name }}</span>
        </NuxtLink>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import type { NavMenuItem } from '~/api/site'
import { resolveMemberIcon, memberItemActive, memberGroupMatches, useMemberBadges } from '~/composables/member-menu'

withDefaults(defineProps<{
    items: NavMenuItem[]
    /** 递归深度（仅用于 key 去重） */
    depth?: number
}>(), { depth: 0 })

const route = useRoute()
const { badgeForUrl, dotForUrl } = useMemberBadges()

const itemActive = (url: string) => memberItemActive(url, route.path)
const groupActive = (item: NavMenuItem) => memberGroupMatches(item, route.path)
</script>

<style lang="scss" scoped>
/* 布局透明壳（单根约束）：子行直接参与父下拉 flex 布局 */
.member-menu-root {
    display: contents;
}

.member-menu-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 14px;
    font-size: 14px;
    color: var(--md-text-2);
    transition: color 0.15s ease, background-color 0.15s ease;

    &:hover {
        color: var(--md-primary);
        background: var(--md-fill);
    }
}

/* 目录行：常态更醒目（图1 分组行），当前路由落在子树内时主题色 */
.member-menu-dir {
    font-weight: 500;
    color: var(--md-text-1);
    cursor: default;
}

.member-menu-dir-active {
    color: var(--md-primary);
}

.member-menu-row-active {
    color: var(--md-primary);
    font-weight: 500;
    background: var(--md-fill);
}

.member-menu-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.member-menu-group {
    position: relative;
}

/*
 * 子级弹层：绝对定位于父行左侧（right:100%），上下右三向留透明 padding
 * 桥接 hover 链，鼠标在行与面板间移动不丢失 :hover。
 */
.member-menu-flyout {
    display: none;
    position: absolute;
    top: -7px;
    right: 100%;
    padding: 7px 7px 0 0;
    z-index: 40;
}

.member-menu-group:hover > .member-menu-flyout {
    display: block;
}

.member-menu-panel {
    min-width: 190px;
    max-height: min(60vh, 420px);
    overflow-y: auto;
    padding: 6px 0;
    background: var(--md-bg);
    border: 1px solid var(--md-border);
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* 暗黑下固定阴影加深一点保持层次 */
html.dark .member-menu-panel {
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4);
}
</style>
