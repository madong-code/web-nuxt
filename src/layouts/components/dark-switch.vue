<template>
    <button
        class="theme-toggle-btn"
        type="button"
        :title="isDark ? '切换到亮色模式' : '切换到暗黑模式'"
        :aria-label="isDark ? '切换到亮色模式' : '切换到暗黑模式'"
        @click="toggleDark"
    >
        <span class="icon-wrap">
            <Icon icon="ant-design:sun-outlined" class="toggle-icon sun-icon" />
            <Icon icon="ant-design:moon-outlined" class="toggle-icon moon-icon" />
        </span>
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '~/components/icon'
import { getDark, toggleDarkWithTransition } from '~/utils/dark'

const isDark = computed(() => getDark())

function toggleDark(e: MouseEvent) {
  toggleDarkWithTransition(e)
}
</script>

<style scoped lang="scss">
.theme-toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover {
        background-color: var(--el-fill-color-light);
    }
}
.icon-wrap {
    position: relative;
    width: 18px;
    height: 18px;
    display: inline-flex;
}
.toggle-icon {
    position: absolute;
    inset: 0;
    margin: auto;
    transition: transform 0.52s ease, opacity 0.4s ease;
}
/* 亮色模式：显示太阳 */
.sun-icon {
    opacity: 1;
    transform: rotate(0deg) scale(1);
}
.moon-icon {
    opacity: 0;
    transform: rotate(-90deg) scale(0.4);
}
/* 暗黑模式：显示月亮 */
@at-root html.dark {
    .sun-icon {
        opacity: 0;
        transform: rotate(90deg) scale(0.4);
    }
    .moon-icon {
        opacity: 1;
        transform: rotate(0deg) scale(1);
    }
}
</style>
