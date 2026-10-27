<template>
    <footer class="w-full bg-[color:var(--md-bg)] border-t border-[color:var(--md-border)] mt-10">
        <div class="max-w-[1250px] mx-auto px-4 py-8">
            <!-- 底部插座菜单（sys_web_menu category=4）：无数据时不渲染，保持历史页脚外观 -->
            <nav
                v-if="footerMenus.length"
                class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[color:var(--md-text-2)] mb-5 pb-5 border-b border-[color:var(--md-border)]"
                aria-label="footer"
            >
                <template v-for="item in footerMenus" :key="item.id || item.path">
                    <a
                        v-if="isExternal(item)"
                        :href="item.url || item.path"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="hover:text-[color:var(--md-primary)] transition-colors"
                    >{{ item.name || item.title }}</a>
                    <NuxtLink
                        v-else
                        :to="item.url || item.path"
                        class="hover:text-[color:var(--md-primary)] transition-colors"
                    >{{ item.name || item.title }}</NuxtLink>
                </template>
            </nav>
            <!-- 友情链接（web_link category=footer，页脚体系）：无数据整行不渲染，外观零变化 -->
            <div
                v-if="friendLinks.length"
                class="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[color:var(--md-border)] pb-5 text-base text-[color:var(--md-text-2)]"
            >
                <span class="font-medium text-[color:var(--md-text-1)]">
                    {{ $t('common.footer.friendlinkTitle') }}
                </span>
                <ElTooltip
                    v-for="link in friendLinks"
                    :key="link.id"
                    :content="link.description || link.name"
                    placement="top"
                    :show-after="200"
                >
                    <a
                        :href="link.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="hover:text-[color:var(--md-primary)] transition-colors"
                    >{{ link.name }}</a>
                </ElTooltip>
            </div>
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-[color:var(--md-text-2)]">
                    <span>{{ copyrightText }}</span>
                    <a
                        v-if="cfg.icp_number"
                        :href="cfg.icp_url || 'https://beian.miit.gov.cn/'"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="hover:text-[color:var(--md-primary)] transition-colors"
                    >
                        {{ cfg.icp_number }}
                    </a>
                    <a
                        v-if="cfg.police_number"
                        :href="cfg.police_url || 'https://beian.mps.gov.cn/'"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 hover:text-[color:var(--md-primary)] transition-colors"
                    >
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M12 2L4 5v6.5c0 4.8 3.4 9 8 10.5 4.6-1.5 8-5.7 8-10.5V5l-8-3z"
                                fill="#D0342C"
                            />
                            <path d="M8.5 12l2.5 2.5L16 9.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        {{ cfg.police_number }}
                    </a>
                </div>
                <div v-if="cfg.show_apply || cfg.show_powered" class="flex items-center gap-4 text-sm">
                    <button
                        v-if="cfg.show_apply"
                        class="text-[color:var(--md-text-2)] hover:text-[color:var(--md-primary)] transition-colors"
                        @click="applyVisible = true"
                    >
                        {{ $t('common.footer.friendlinkApply') }}
                    </button>
                    <span v-if="cfg.show_powered" class="text-[color:var(--md-text-3)]">
                        {{ $t('common.footer.poweredBy') }}
                    </span>
                </div>
            </div>
        </div>

        <!-- 友链申请弹窗（ClientOnly：交互弹层不做 SSR，避免隐藏 overlay 的注水样式 mismatch） -->
        <ClientOnly>
            <FriendlinkApplyDialog v-model="applyVisible" />
        </ClientOnly>
    </footer>
</template>

<script setup lang="ts">
import { ElTooltip } from 'element-plus'

import { t } from '~/composables/lang'
const $t = t
import { getLinks, type WebSiteConfig } from '~/api/site'
import FriendlinkApplyDialog from '~/components/friendlink/apply-dialog.vue'
import { useSiteConfig } from '~/composables/site-config'

const year = new Date().getFullYear()
const applyVisible = ref(false)

// 布局层已 await 同一 key，此处直接消费 SSR 数据
const { data } = useSiteConfig()
const cfg = computed<WebSiteConfig>(() => data.value!)

// 页脚友情链接：框架 web_link category=footer（启用项，sort 升序），SSR 直出
const { data: friendLinks } = await useAsyncData('site-links', () => getLinks({ type: 'footer' }), {
    default: () => [],
})

// 底部插座菜单：统一来自 sys_web_menu 体系（/site/nav-config → systemStore.footer_menu）
// SSR 阶段由 init-site.server.ts 预加载注水，刷新不再丢导航配置
const systemStore = useSystemStore()
const footerMenus = computed<any[]>(() => systemStore.footerMenus || [])

/** 外链判断：显式新窗口 target 或 http(s) 绝对地址 */
const isExternal = (item: any) =>
    item?.meta?.target === '_blank' || /^https?:\/\//i.test(item?.url || item?.path || '')

/** 版权文案：后台自定义模板（支持 {year}/{site} 占位），为空走默认句式 */
const copyrightText = computed(() => {
    const site = cfg.value.site_name
    const tpl = cfg.value.copyright?.trim()
        ? cfg.value.copyright
        : `© {year} {site} · ${t('common.footer.copyright')}`
    return tpl.replaceAll('{year}', String(year)).replaceAll('{site}', site)
})
</script>
