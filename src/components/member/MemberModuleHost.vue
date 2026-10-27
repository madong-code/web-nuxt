<script setup lang="ts">
/**
 * 个人中心组件级模块宿主（通用内容区插座）：
 * - 按 surface 渲染全部通过 defineMemberModule 注册的插件模块组件
 * - 每个模块独立挂卸（随页签/路由切换即插即用），上下文经 useMemberShellCtx 注入
 * - visibility(ctx) 业务过滤在渲染前执行；空注册表时整体无痕（不占位）
 * - 样式隔离由各模块组件 scoped 样式自保证；本宿主不施加任何布局样式
 */
import { useMemberModules, useMemberShellCtx } from '~/composables/member-modules'

defineOptions({ name: 'MemberModuleHost' })

const props = defineProps<{
    /** 渲染面：'overview'（概述页）等，与模块声明的 surfaces 匹配 */
    surface: string
}>()

const ctx = useMemberShellCtx()
const { modules } = useMemberModules(props.surface)

/** 可见性：注册表静态过滤（surfaces/order）+ 运行时业务过滤（visibility） */
const visibleModules = computed(() =>
    modules.filter((def) => !def.visibility || def.visibility(ctx)),
)
</script>

<template>
  <template v-for="def in visibleModules" :key="def.id">
    <component :is="def.component" />
  </template>
</template>
