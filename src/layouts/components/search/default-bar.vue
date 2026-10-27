<template>
    <!-- 嵌入导航栏形态：小圆角框 + 图标 + 占位文字 + 快捷键提示 -->
    <button v-if="embedded" type="button" class="fds-trigger-embed" role="button" tabindex="0"
        :aria-label="$t('common.search.placeholder')" @click="open">
        <SearchIcon class="fds-trigger-icon" :size="15" :stroke-width="2" aria-hidden="true" />
        <span v-if="showText" class="fds-trigger-embed-text">{{ $t('common.search.placeholder') }}</span>
        <kbd v-if="showShortcut" class="fds-trigger-kbd">/</kbd>
    </button>

    <!-- 移动端抽屉形态：带图标全宽按钮 -->
    <button v-else type="button"
        class="fds-trigger-block flex w-full items-center gap-2 rounded-md border border-[color:var(--el-border-color)] px-3 py-2 text-sm text-[color:var(--el-text-color-regular)] transition-colors hover:bg-[color:var(--el-fill-color-light)]"
        @click="open">
        <SearchIcon class="shrink-0 opacity-70" :size="16" aria-hidden="true" />
        <span v-if="showText" class="truncate">{{ $t('common.search.placeholder') }}</span>
    </button>
</template>

<script setup lang="ts">
import { t } from '~/composables/lang'

const $t = t
/**
 * 框架默认搜索触发钮（无插件注册时的兜底实现）：
 * - 与 portal 插件触发钮同 props 契约（embedded / showText / showShortcut），
 *   挂载点经 $attrs 透传，插件与默认实现可无缝互换
 * - 点击打开框架默认搜索面板（default-panel.vue，经 Nuxt useState 通讯，
 *   与注册表 store 解耦，不依赖任何插件）
 * - 图标必须显式 import lucide 的 SearchIcon：EP 图标已全局注册同名 Search，
 *   不 import 会被抢占且忽略 :size prop（渲染 1em 溢出）
 */
import { Search as SearchIcon } from 'lucide-vue-next'

defineOptions({ name: 'DefaultSearchBar' })

withDefaults(defineProps<{
    /** 嵌入导航栏形态（桌面端） */
    embedded?: boolean
    /** 是否显示占位文字 */
    showText?: boolean
    /** 是否显示快捷键提示（/） */
    showShortcut?: boolean
}>(), {
    embedded: false,
    showText: false,
    showShortcut: true,
})

const open = () => {
    useState('default-search-open').value = true
}
</script>

<style scoped>
.fds-trigger-embed {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    /* 预留输入框观感的宽度：图标居左、快捷键角标推到右侧 */
    min-width: 180px;
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color);
    background: var(--el-fill-color-blank);
    color: var(--el-text-color-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.fds-trigger-embed:hover,
.fds-trigger-embed:focus-visible {
    border-color: var(--el-color-primary);
    color: var(--el-text-color-regular);
    outline: none;
}

.fds-trigger-icon {
    flex-shrink: 0;
    opacity: 0.75;
}

.fds-trigger-embed-text {
    white-space: nowrap;
}

.fds-trigger-kbd {
    display: inline-flex;
    align-items: center;
    height: 18px;
    padding: 0 5px;
    border-radius: 4px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);
    font-family: inherit;
    font-size: 11px;
    line-height: 1;
    color: var(--el-text-color-placeholder);
}
</style>
