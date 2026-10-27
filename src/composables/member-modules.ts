import { computed, inject, readonly } from 'vue'
import type { Component, ComputedRef, InjectionKey, Ref } from 'vue'
import type { NavMenuItem, WebSiteConfig } from '~/api/site'
import type { useMemberStore } from '~/stores/member'

/**
 * 个人中心组件级扩展接口（插件页面模块注册表）：
 * - 插件在 `plugin/<name>/member-modules/*.ts` 中 `export default defineMemberModule({...})`
 *   即完成注册，由本文件 import.meta.glob 自动发现，无需改框架任何文件
 * - surfaces 声明模块渲染面（'overview' 概述页入口卡等），order 控制排序
 * - visibility(ctx) 可选业务过滤：入参为 MemberShell 注入的上下文（会员状态/徽章/导航）
 * - 样式隔离与生命周期约定见 specs/member-module/spec.md
 */

/** MemberShell 向嵌入模块提供的上下文（provide 于 layouts/member.vue 的壳内） */
export interface MemberShellContext {
    /** 会员状态（readonly，禁止模块直接改写） */
    memberStore: Readonly<ReturnType<typeof useMemberStore>>
    /** 站点配置（共享 useAsyncData key，含 membership_enabled 等） */
    siteCfg: Ref<WebSiteConfig>
    /** 数字徽章（count 模式 provider 未读数） */
    badgeForUrl: (url: string) => string
    /** 红点提示（dot 模式 provider 有未读） */
    dotForUrl: (url: string) => boolean
    /** 重拉前台导航（member_menus 更新后调用） */
    refreshNav: () => Promise<void> | void
    /** 当前激活分组（tag 导航行 1） */
    activeGroup: ComputedRef<NavMenuItem | null>
    /** 当前分组子项（tag 导航行 2） */
    activePills: ComputedRef<NavMenuItem[]>
}

export const memberShellCtxKey: InjectionKey<MemberShellContext> = Symbol('memberShellCtx')

/** 模块渲染面（当前仅 overview；后续如 member:sidebar 在此扩充） */
export type MemberModuleSurface = 'overview'

export interface MemberModuleDef {
    /** 全局唯一 id（建议 plugin:name 形式，如 demo:hello） */
    id: string
    title: string
    icon?: Component
    /** 同 surface 内排序，小者在前，缺省 100 */
    order?: number
    surfaces: MemberModuleSurface[]
    /** 关联菜单 code（portal:xxx），未来按权限码联动时使用 */
    menuCode?: string
    /** 可选业务可见性过滤（成员登录态/站点开关等；可见性主体仍信任后端菜单过滤） */
    visibility?: (ctx: MemberShellContext) => boolean
    /** 模块内容组件（仅渲染自身内容，不自带壳/导航） */
    component: Component
}

/** 模块声明器：类型约束 + 前向兼容占位（与 defineStore 同风格） */
export function defineMemberModule(def: MemberModuleDef): MemberModuleDef {
    if (import.meta.dev && !def.id) {
        console.warn('[member-modules] 模块缺少 id：', def.title)
    }
    return def
}

/** 自动发现全部插件模块（eager 收集，构建期静态化） */
const moduleFiles = import.meta.glob<{ default?: MemberModuleDef } | MemberModuleDef>(
    '~/plugin/*/member-modules/*.ts',
    { eager: true },
)

const allMemberModules: MemberModuleDef[] = Object.values(moduleFiles)
    .map((mod) => (('component' in (mod as MemberModuleDef) ? mod : (mod as { default?: MemberModuleDef }).default) as MemberModuleDef))
    .filter((def): def is MemberModuleDef => !!def?.component && !!def.id)

/** 取指定渲染面的模块列表（surfaces 过滤 + order 排序；visibility 由宿主按上下文过滤） */
export function useMemberModules(surface: MemberModuleSurface | string) {
    const list = allMemberModules
        .filter((def) => def.surfaces.includes(surface as MemberModuleSurface))
        .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
    return { modules: list }
}

/** 嵌入模块内部读取壳上下文（仅限 MemberModuleHost 渲染的组件树内调用） */
export function useMemberShellCtx(): MemberShellContext {
    const ctx = inject(memberShellCtxKey, null)
    if (!ctx) {
        throw new Error('[member-modules] useMemberShellCtx 必须在 MemberShell 上下文内使用（模块须嵌入个人中心内容区）')
    }
    return ctx
}

/** 供 MemberShell 完成上下文注入（readonly 防模块直改会员状态） */
export function provideMemberShellCtx(ctx: {
    memberStore: ReturnType<typeof useMemberStore>
    siteCfg: Ref<WebSiteConfig>
    badgeForUrl: (url: string) => string
    dotForUrl: (url: string) => boolean
    refreshNav: () => Promise<void> | void
    activeGroup: ComputedRef<NavMenuItem | null>
    activePills: ComputedRef<NavMenuItem[]>
}): void {
    const provided: MemberShellContext = {
        memberStore: readonly(ctx.memberStore) as unknown as MemberShellContext['memberStore'],
        siteCfg: computed(() => ctx.siteCfg.value) as Ref<WebSiteConfig>,
        badgeForUrl: ctx.badgeForUrl,
        dotForUrl: ctx.dotForUrl,
        refreshNav: ctx.refreshNav,
        activeGroup: ctx.activeGroup,
        activePills: ctx.activePills,
    }
    provide(memberShellCtxKey, provided)
}
