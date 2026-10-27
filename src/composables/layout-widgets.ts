import type { Component } from 'vue'

/**
 * 布局层组件级扩展接口（框架层注册表，与 member-modules 同模式）：
 * - 布局骨架（layouts/*）属于框架核心，禁止直接 import `~/plugin/**` 下的第三方插件
 *   组件——插件卸载会直接导致构建/渲染异常（核心依赖被置于第三方插件之后）
 * - 插件在 `plugin/<name>/layout-widgets/*.ts` 中 `export default defineLayoutWidget({...})`
 *   即完成注册，由本文件 import.meta.glob 自动发现；卸载插件后注册表自然为空，
 *   布局经 AppWidgetHost 渲染时无痕降级，核心功能不受影响
 * - slot 对应布局中的挂载点名（如 'chat-window'），order 控制同插槽内排序
 */

export interface LayoutWidgetDef {
    /** 全局唯一 id（建议 plugin:name 形式，如 portal:chat-window） */
    id: string
    /** 渲染插槽名：与布局中 <AppWidgetHost slot-name="..." /> 对应 */
    slot: string
    /** 同插槽内排序，小者在前，缺省 100 */
    order?: number
    /** 挂件组件（自带 ClientOnly/Teleport 等自渲染逻辑，宿主不包裹） */
    component: Component
}

/** 挂件声明器：类型约束 + 前向兼容占位（与 defineMemberModule 同风格） */
export function defineLayoutWidget(def: LayoutWidgetDef): LayoutWidgetDef {
    if (import.meta.dev && !def.id) {
        console.warn('[layout-widgets] 挂件缺少 id：', def.slot)
    }
    return def
}

/** 自动发现全部插件挂件（eager 收集，构建期静态化；插件目录缺失时注册表为空，不报错） */
const widgetFiles = import.meta.glob<{ default?: LayoutWidgetDef } | LayoutWidgetDef>(
    '~/plugin/*/layout-widgets/*.ts',
    { eager: true },
)

const allLayoutWidgets: LayoutWidgetDef[] = Object.values(widgetFiles)
    .map((mod) =>
        ('component' in (mod as LayoutWidgetDef)
            ? (mod as LayoutWidgetDef)
            : ((mod as { default?: LayoutWidgetDef }).default as LayoutWidgetDef)),
    )
    .filter((def): def is LayoutWidgetDef => !!def?.component && !!def.id && !!def.slot)

/** 取指定插槽的挂件列表（slot 过滤 + order 排序） */
export function useLayoutWidgets(slot: string) {
    const widgets = allLayoutWidgets
        .filter((def) => def.slot === slot)
        .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
    return { widgets }
}
