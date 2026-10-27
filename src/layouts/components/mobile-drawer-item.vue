<template>
    <div>
        <!-- 有子级：行内链接 + 展开按钮（子级可继续嵌套，支持任意层级） -->
        <div v-if="hasChildren" class="flex items-stretch">
            <NuxtLink
                :to="item.to"
                :target="item.external ? '_blank' : undefined"
                :rel="item.external ? 'noopener' : undefined"
                class="mobile-nav-link flex-1"
                :class="{ 'mobile-nav-link-active': item.active }"
                :style="indentStyle"
                @click="closeDrawer"
            >
                <span class="truncate">{{ item.label }}</span>
            </NuxtLink>
            <button
                class="mobile-sub-toggle"
                :aria-label="`Toggle ${item.label}`"
                :aria-expanded="open"
                @click="toggle"
            >
                <ChevronDown class="w-4 h-4 transition-transform" :class="open ? 'rotate-180' : ''" />
            </button>
        </div>
        <!-- 无子级 -->
        <NuxtLink
            v-else
            :to="item.to"
            :target="item.external ? '_blank' : undefined"
            :rel="item.external ? 'noopener' : undefined"
            class="mobile-nav-link"
            :class="{ 'mobile-nav-link-active': item.active }"
            :style="indentStyle"
            @click="closeDrawer"
        >
            {{ item.label }}
        </NuxtLink>

        <div v-show="open" class="bg-[color:var(--md-fill)]">
            <LayoutMobileDrawerItem
                v-for="sub in item.children"
                :key="sub.to"
                :item="sub"
                :indent="indent + 1"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

defineOptions({ name: 'LayoutMobileDrawerItem' })

/** 与统一 header 的 NavEntry/NavChild 同构（label/to/external/active/children） */
export interface NavItem {
    label: string
    to: string
    external: boolean
    active: boolean
    children: NavItem[] | null
}

const props = withDefaults(defineProps<{ item: NavItem; indent?: number }>(), { indent: 0 })

// 关闭抽屉由 mobile-drawer provide，递归任意层级的链接点击都能收起抽屉
const closeDrawer = inject<() => void>('md-drawer-close', () => {})

const hasChildren = computed(() => !!props.item.children?.length)
// 默认自动展开包含当前页的分支；用户手动开合后尊重手动状态（随路由变化仍会自动跟随）
const hasActiveChild = computed(() => !!props.item.children?.some((c) => c.active))
const toggled = ref<boolean | null>(null)
const open = computed(() => (toggled.value === null ? hasActiveChild.value : toggled.value))

function toggle() {
    toggled.value = !open.value
}

const indentStyle = computed(() => ({ paddingLeft: `${16 + props.indent * 16}px` }))
</script>
