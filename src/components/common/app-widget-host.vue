<script setup lang="ts">
/**
 * 布局层挂件宿主（框架核心组件）：
 * - 按 slot 名渲染全部经 defineLayoutWidget 注册的插件挂件
 * - 布局骨架只依赖本宿主，不直接 import 任何插件组件；
 *   插件卸载后注册表为空，宿主整体无痕（不占位、不报错）
 * - 挂件自带 ClientOnly/Teleport 等自渲染逻辑，本宿主不施加任何样式
 */
import { useLayoutWidgets } from '~/composables/layout-widgets'

defineOptions({ name: 'AppWidgetHost' })

const props = defineProps<{
    /** 渲染插槽名：与挂件声明的 slot 匹配 */
    slotName: string
}>()

const { widgets } = useLayoutWidgets(props.slotName)
</script>

<template>
  <template v-for="def in widgets" :key="def.id">
    <component :is="def.component" />
  </template>
</template>
