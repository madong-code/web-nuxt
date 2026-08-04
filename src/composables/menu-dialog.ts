/**
 * 菜单弹窗通用管理：注册表 + 响应式状态
 *
 * 用法：
 * 1. menu-builder 调用 registerMenuDialog(path, componentLoader, meta) 注册
 * 2. menu-sub.vue 中检测 menu.type === 'dialog'，调用 useMenuDialog().open(path)
 * 3. MenuDialog.vue 监听状态，使用 defineAsyncComponent 渲染
 */
import { ref } from 'vue'
import type { Component } from 'vue'

export interface MenuDialogMeta {
    title: string
    icon?: string
}

// ========== 模块级注册表（无需 Vue 上下文即可访问）==========
const componentMap = new Map<string, () => Promise<Component>>()
const metaMap = new Map<string, MenuDialogMeta>()

/** 注册菜单弹窗组件（由 menu-builder 在构建菜单时调用） */
export function registerMenuDialog(
    path: string,
    loader: () => Promise<Component>,
    meta?: MenuDialogMeta,
) {
    componentMap.set(path, loader)
    if (meta) metaMap.set(path, meta)
}

// ========== 响应式弹窗状态（Vue 组件内使用）==========
const dialogVisible = ref(false)
const dialogPath = ref('')

export function useMenuDialog() {
    function open(path: string) {
        if (componentMap.has(path)) {
            dialogPath.value = path
            dialogVisible.value = true
        }
    }

    function close() {
        dialogVisible.value = false
    }

    function getLoader(path: string) {
        return componentMap.get(path)
    }

    function getMeta(path: string) {
        return metaMap.get(path)
    }

    return {
        visible: dialogVisible,
        currentPath: dialogPath,
        open,
        close,
        getLoader,
        getMeta,
        componentMap,
    }
}
