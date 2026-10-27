<template>
    <!--
        主导航递归节点：depth=0 为顶栏触发项（通栏高度+下划线选中态），
        depth>0 为下拉面板内的行（子级再有子栏目时向右浮出二级面板，支持任意层级）。
        面板开合用 CSS 子选择器精准控制：仅当前行 hover 展开直属面板，
        避免嵌套 group-hover 导致父级 hover 时所有层级同时全开。
    -->
    <div class="pnm-item relative" :class="lvl === 0 ? 'h-full flex items-stretch' : ''">
        <NuxtLink
            :to="item.to"
            :target="item.external ? '_blank' : undefined"
            :rel="item.external ? 'noopener' : undefined"
            class="pnm-trigger"
            :class="{ 'pnm-trigger-root': lvl === 0, 'pnm-trigger-active': item.active }"
            @click="onItemClick"
        >
            <span>{{ item.label }}</span>
            <ChevronDown v-if="hasChildren && lvl === 0" class="w-3.5 h-3.5 opacity-60 shrink-0" />
            <ChevronRight v-else-if="hasChildren" class="w-3 h-3 opacity-50 shrink-0" />
        </NuxtLink>

        <div
            v-if="hasChildren"
            class="pnm-panel absolute z-30"
            :class="lvl === 0 ? 'left-0 top-full pt-1.5' : 'left-full top-0 pl-1'"
        >
            <div class="min-w-44 bg-[color:var(--md-bg)] rounded-lg border border-[color:var(--md-border)] shadow-lg py-1.5">
                <LayoutNavMenu
                    v-for="sub in item.children"
                    :key="sub.to"
                    :item="sub"
                    :depth="lvl + 1"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import { useSystemStore } from '~/stores/system'
import { useMenuDialog } from '~/composables/menu-dialog'
import { MenuType, type Menus } from '~/stores/interface'

defineOptions({ name: 'LayoutNavMenu' })

/** 与统一 header 的 NavEntry/NavChild 同构（label/to/external/active/children） */
export interface NavItem {
    label: string
    to: string
    external: boolean
    active: boolean
    children: NavItem[] | null
}

const props = withDefaults(defineProps<{ item: NavItem; depth?: number }>(), { depth: 0 })
const lvl = computed(() => props.depth)
const hasChildren = computed(() => !!props.item.children?.length)

// dialog 型菜单：弹窗渲染组件，不跳转路由（对齐框架 menu-sub 行为）。
// web_menu 数据源不含 menu type，经框架 systemStore.site.head_nav 按 path 关联判定。
const systemStore = useSystemStore()
const { open: openMenuDialog } = useMenuDialog()

function findFrameworkMenu(list: Menus[] | undefined, to: string): Menus | null {
    for (const m of list ?? []) {
        if (m.path && m.path === to) return m
        const hit = findFrameworkMenu(m.children, to)
        if (hit) return hit
    }
    return null
}

function onItemClick(e: MouseEvent) {
    if (props.item.external) return
    const fw = findFrameworkMenu(systemStore.site.head_nav as Menus[], props.item.to)
    if (fw && fw.type === MenuType.DIALOG && fw.path) {
        e.preventDefault()
        openMenuDialog(fw.path)
    }
}
</script>

<style scoped>
.pnm-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 16px;
    font-size: 14px;
    color: var(--md-text-2);
    white-space: nowrap;
    text-align: left;
    transition: color 0.2s ease;
}

.pnm-trigger:hover {
    color: var(--md-primary);
}

.pnm-trigger-active {
    color: var(--md-primary);
    font-weight: 500;
}

/* 顶级触发项：与顶栏普通导航项一致（通栏高度、15px、底部下划线选中态） */
.pnm-trigger-root {
    width: auto;
    position: relative;
    height: 100%;
    padding: 0 14px;
    font-size: 15px;
}

.pnm-trigger-root::after {
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

.pnm-trigger-active::after {
    transform: scaleX(1);
}

/* 子面板默认隐藏，仅当前行 hover 时展开其直属面板（子选择器限定，避免多级联动全开） */
.pnm-panel {
    display: none;
}

.pnm-item:hover > .pnm-panel {
    display: block;
}
</style>
