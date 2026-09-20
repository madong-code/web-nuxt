<template>
    <el-popover
        placement="bottom-end"
        :width="212"
        trigger="click"
        popper-class="theme-panel-popper"
        :show-arrow="false"
        @show="panelVisible = true"
        @hide="panelVisible = false"
    >
        <template #reference>
            <button
                class="theme-panel-trigger"
                :class="{ 'is-open': panelVisible }"
                type="button"
                :title="t('common.themeSetting')"
                :aria-label="t('common.themeSetting')"
            >
                <Icon icon="mdi:palette-outline" size="18" />
            </button>
        </template>

        <div class="theme-panel">
            <!-- 主题色 -->
            <div class="panel-label">{{ t('common.themeColor') }}</div>
            <div class="color-list">
                <button
                    v-for="preset in THEME_PRESETS"
                    :key="preset.color"
                    type="button"
                    class="color-item"
                    :class="{ 'is-active': currentColor === preset.color }"
                    :style="{ '--swatch': preset.color }"
                    :title="preset.name"
                    :aria-label="preset.name"
                    @click="selectColor(preset.color)"
                >
                    <span class="swatch"></span>
                </button>
            </div>

            <!-- 外观 -->
            <div class="panel-label">{{ t('common.appearance') }}</div>
            <div class="appearance-list">
                <button
                    type="button"
                    class="appearance-item"
                    :class="{ 'is-active': !isDark }"
                    :title="t('common.lightMode')"
                    :aria-label="t('common.lightMode')"
                    @click="switchAppearance($event, false)"
                >
                    <Icon icon="ant-design:sun-outlined" size="16" />
                </button>
                <button
                    type="button"
                    class="appearance-item"
                    :class="{ 'is-active': isDark }"
                    :title="t('common.darkMode')"
                    :aria-label="t('common.darkMode')"
                    @click="switchAppearance($event, true)"
                >
                    <Icon icon="ant-design:moon-outlined" size="16" />
                </button>
            </div>
        </div>
    </el-popover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '~/components/icon'
import { t } from '~/composables/lang'
import { THEME_PRESETS, getThemeColor, setThemeColor } from '~/utils/theme'
import { getDark, toggleDarkWithTransition } from '~/utils/dark'

// 当前主题色（getThemeColor 基于 cookie ref，具备响应性）
const currentColor = ref(getThemeColor() || THEME_PRESETS[0].color)
const isDark = computed(() => getDark())
const panelVisible = ref(false)

/** 切换主题色 */
function selectColor(color: string) {
    currentColor.value = color
    setThemeColor(color)
}

/** 切换亮/暗外观（复用圆形揭示过渡动画） */
function switchAppearance(e: MouseEvent, dark: boolean) {
    if (isDark.value === dark) return
    toggleDarkWithTransition(e)
}
</script>

<style scoped lang="scss">
.theme-panel-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background-color: var(--el-bg-color);
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, background-color 0.2s;

    &:hover,
    &.is-open {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary);
    }
}
</style>

<!-- 面板内容（el-popover 渲染在 body，需非 scoped 全局样式） -->
<style lang="scss">
.theme-panel-popper {
    min-width: auto !important;
    border-radius: 12px !important;

    .theme-panel {
        padding: 4px 2px 2px;
    }

    .panel-label {
        margin-bottom: 10px;
        font-size: 12px;
        font-weight: 500;
        color: var(--el-text-color-secondary);
    }

    .color-list {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
    }

    .color-item {
        box-sizing: content-box;
        width: 22px;
        height: 22px;
        padding: 2px;
        border: 1px solid transparent;
        border-radius: 7px;
        background: transparent;
        cursor: pointer;
        transition: border-color 0.2s;

        .swatch {
            display: block;
            width: 100%;
            height: 100%;
            border-radius: 5px;
            background-color: var(--swatch);
        }

        // 选中态：色块外圈出现同色描边（padding 形成留白间隙）
        &.is-active {
            border-color: var(--swatch);
        }

        &:hover {
            border-color: var(--swatch);
        }
    }

    .appearance-list {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 4px;
    }

    .appearance-item {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 1px solid var(--el-border-color);
        border-radius: 8px;
        background-color: transparent;
        color: var(--el-text-color-regular);
        cursor: pointer;
        transition: color 0.2s, border-color 0.2s;

        &:hover {
            color: var(--el-color-primary);
            border-color: var(--el-color-primary);
        }

        &.is-active {
            color: var(--el-color-primary);
            border-color: var(--el-color-primary);
        }
    }
}
</style>
