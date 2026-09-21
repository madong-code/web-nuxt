<template>
  <el-backtop class="ma-backtop" target=".main-scrollbar .el-scrollbar__wrap" />
</template>

<script setup lang="ts">
// 框架内置「回到顶部」按钮（框架级功能，非插件功能）
// 布局滚动容器是 el-scrollbar（.main-scrollbar），window 不滚动，
// 因此 el-backtop 必须通过 target 指向 scrollbar 的 wrap 元素才能正常出现与回顶。
</script>

<style>
/* 提升层级，避免被页面固定侧栏/目录遮挡（如文档页左侧栏 z-index:100、右侧 TOC z-index:99）；
   仍低于 header(1000) 与弹窗层级 */
.ma-backtop {
  z-index: 102;
}
</style>
