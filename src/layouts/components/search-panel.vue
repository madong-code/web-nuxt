<template>
    <component :is="provider?.panel" v-if="provider?.panel" />
</template>

<script setup lang="ts">
/**
 * 头部搜索面板挂载点（框架中性插槽，注册模式）：
 * - 插件通过 stores/search.ts 注册搜索面板（见 portal 的 plugins/search.ts）
 * - 框架不实现搜索、不 import 任何插件模块；无注册时本插槽不渲染任何内容
 * - 触发钮与面板之间的通讯完全由插件自身逻辑（composable）完成，框架不感知
 */
defineOptions({ name: 'LayoutSearchPanel' })

const { active: provider } = storeToRefs(useSearchStore())
</script>
