<template>
    <component :is="provider?.bar" v-if="provider?.bar" v-bind="$attrs" />
</template>

<script setup lang="ts">
/**
 * 头部搜索挂载点（框架中性插槽，注册模式）：
 * - 插件通过 stores/search.ts 注册搜索触发钮（见 portal 的 plugins/search.ts）
 * - 框架不实现搜索、不 import 任何插件模块；无注册时本插槽不渲染任何内容
 * - embedded / show-text / show-shortcut 等 props 经 $attrs 透传给插件触发钮
 */
defineOptions({ name: 'LayoutSearchBar', inheritAttrs: false })

const { active: provider } = storeToRefs(useSearchStore())
</script>
