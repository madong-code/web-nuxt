<template>
    <Teleport to="body">
        <Transition name="fds-fade">
            <div v-if="isOpen" class="fds-overlay" role="dialog" aria-modal="true"
                :aria-label="$t('common.search.placeholder')" @click.self="close">
                <div class="fds-panel">
                    <div class="fds-input-row">
                        <Search class="fds-input-icon" :size="16" aria-hidden="true" />
                        <input ref="inputRef" v-model="keyword" class="fds-input" :placeholder="$t('common.search.placeholder')"
                            type="text" enterkeyhint="search" @keydown.enter.prevent="submit"
                            @keydown.down.prevent @keydown.up.prevent @keydown.esc.prevent="close">
                        <button v-if="keyword" type="button" class="fds-clear" :aria-label="$t('common.cancel')"
                            @click="keyword = ''">
                            <X :size="14" aria-hidden="true" />
                        </button>
                    </div>

                    <div class="fds-body">
                        <!-- 空关键词：提示（插件可注册 UI 覆盖整体接管，或注册数据源走本聚合面板） -->
                        <div v-if="!keyword.trim()" class="fds-hint">
                            <Search class="fds-hint-icon" :size="28" aria-hidden="true" />
                            <p class="fds-hint-title">{{ $t('common.search.emptyTitle') }}</p>
                            <p class="fds-hint-desc">{{ $t('common.search.emptyDesc') }}</p>
                        </div>

                        <!-- 加载骨架 -->
                        <div v-else-if="searching && groups.length === 0" class="fds-skeleton" aria-hidden="true">
                            <div v-for="i in 4" :key="i" class="fds-skeleton-row">
                                <div class="fds-skeleton-line" :style="{ width: 40 + (i % 3) * 18 + '%' }" />
                                <div class="fds-skeleton-line short" :style="{ width: 22 + (i % 2) * 14 + '%' }" />
                            </div>
                        </div>

                        <!-- 无任何数据源：回落空态 -->
                        <div v-else-if="groups.length === 0" class="fds-hint">
                            <Search class="fds-hint-icon" :size="28" aria-hidden="true" />
                            <p class="fds-hint-title">{{ $t('common.search.emptyTitle') }}</p>
                            <p class="fds-hint-desc">{{ $t('common.search.emptyDesc') }}</p>
                        </div>

                        <!-- 聚合分组建议：组标题 = source.title，失败组内联提示 -->
                        <template v-else>
                            <div v-for="g in groups" :key="g.source.id" class="fds-group">
                                <template v-if="g.error">
                                    <p class="fds-group-title">{{ g.source.title || g.source.id }}</p>
                                    <p class="fds-group-error">{{ $t('common.search.sourceUnavailable') }}</p>
                                </template>
                                <template v-else-if="g.items.length">
                                    <p class="fds-group-title">{{ g.source.title || g.source.id }}</p>
                                    <button v-for="(item, idx) in g.items" :key="idx" type="button" class="fds-item"
                                        @click="go(item.url)">
                                        <span class="fds-item-title">
                                            {{ item.title }}
                                            <span v-if="item.kindLabel" class="fds-item-kind">{{ item.kindLabel }}</span>
                                        </span>
                                        <span v-if="item.description" class="fds-item-desc">{{ item.description }}</span>
                                    </button>
                                </template>
                            </div>
                            <div v-if="!hasResults" class="fds-hint">
                                <Search class="fds-hint-icon" :size="28" aria-hidden="true" />
                                <p class="fds-hint-title">{{ $t('common.search.noResult') }}</p>
                            </div>
                        </template>
                    </div>

                    <div class="fds-footer">
                        <span class="fds-kbd"><kbd>Enter</kbd> {{ $t('common.search.toSearch') }}</span>
                        <span class="fds-kbd"><kbd>Esc</kbd> {{ $t('common.cancel') }}</span>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { t } from '~/composables/lang'

const $t = t
/**
 * 框架默认搜索面板（聚合模式统一实现）：
 * - 悬浮遮罩面板：输入 300ms 防抖 → useSearchStore().searchAll 聚合全部已注册
 *   数据源（Promise.allSettled 错误隔离）→ 按源分组渲染轻量建议列表（每源 limit=5）
 * - 无插件注册数据源时保持框架默认空态；存在 UI 覆盖注册（SearchProvider）时
 *   本面板被整体替换（active 提供者裁决，见 stores/search.ts）
 * - 打开状态经 Nuxt useState('default-search-open') 与 default-bar.vue 通讯；
 *   回车跳转框架统一搜索页 /search?q=（pages/search.vue），全局快捷键 `/` 或 Ctrl+K
 */
import { Search, X } from 'lucide-vue-next'
import type { SearchSourceGroup } from '~/stores/search'

defineOptions({ name: 'DefaultSearchPanel' })

const route = useRoute()
const isOpen = useState('default-search-open', () => false)
const keyword = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const groups = ref<SearchSourceGroup[]>([])
const searching = ref(false)
let searchSeq = 0
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const hasResults = computed(() => groups.value.some((g) => g.items.length > 0))

const doSearch = async (kw: string) => {
    const seq = ++searchSeq
    searching.value = true
    try {
        const res = await useSearchStore().searchAll(kw, { limit: 5 })
        if (seq === searchSeq) groups.value = res.groups
    } catch {
        if (seq === searchSeq) groups.value = []
    } finally {
        if (seq === searchSeq) searching.value = false
    }
}

// 关键词 300ms 防抖搜索；清空立即复位
watch(keyword, (kw) => {
    if (debounceTimer) {
        clearTimeout(debounceTimer)
        debounceTimer = null
    }
    const q = kw.trim()
    if (!q) {
        searchSeq++
        groups.value = []
        searching.value = false
        return
    }
    debounceTimer = setTimeout(() => doSearch(q), 300)
})

const open = () => {
    isOpen.value = true
    // 已在搜索页时回显当前关键词
    const q = route.query.q
    if (route.path === '/search' && typeof q === 'string') {
        keyword.value = q
    }
    nextTick(() => inputRef.value?.focus())
}

const close = () => {
    isOpen.value = false
}

const submit = () => {
    const q = keyword.value.trim()
    if (!q) return
    close()
    navigateTo({ path: '/search', query: { q } })
}

const go = (url: string) => {
    close()
    navigateTo(url)
}

// `/`（非输入态）或 Ctrl+K / Cmd+K 全局唤起；面板开着时按 `/` 不关闭（此时焦点
// 多在输入框内，需保证 `/` 可正常输入，不做 toggle）
const onGlobalKeydown = (e: KeyboardEvent) => {
    if (e.isComposing) return
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        isOpen.value ? close() : open()
        return
    }
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isOpen.value) {
        const target = e.target as HTMLElement | null
        const editable = !!target
            && (target.isContentEditable
                || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
        if (!editable) {
            e.preventDefault()
            open()
        }
    }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => {
    window.removeEventListener('keydown', onGlobalKeydown)
    if (debounceTimer) clearTimeout(debounceTimer)
})

// 面板打开时锁定背景滚动
watch(isOpen, (v) => {
    if (import.meta.client) {
        document.body.style.overflow = v ? 'hidden' : ''
    }
})
onBeforeUnmount(() => {
    if (import.meta.client) document.body.style.overflow = ''
})

// 路由变化时自动收起（如其它入口跳转）
watch(() => route.fullPath, () => {
    if (isOpen.value) close()
})
</script>

<style scoped>
.fds-overlay {
    position: fixed;
    inset: 0;
    z-index: 2100;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 12vh 16px 16px;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
}

.fds-panel {
    display: flex;
    flex-direction: column;
    width: min(560px, 100%);
    max-height: 70vh;
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    box-shadow: var(--el-box-shadow-dark);
    overflow: hidden;
}

.fds-input-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.fds-input-icon {
    flex-shrink: 0;
    color: var(--el-text-color-placeholder);
}

.fds-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 15px;
    color: var(--el-text-color-primary);
}

.fds-input::placeholder {
    color: var(--el-text-color-placeholder);
}

.fds-clear {
    display: inline-flex;
    border: none;
    background: transparent;
    color: var(--el-text-color-placeholder);
    cursor: pointer;
    padding: 2px;
}

.fds-clear:hover {
    color: var(--el-text-color-regular);
}

.fds-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px 24px;
}

.fds-body:has(.fds-hint) {
    padding: 32px 24px;
}

.fds-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
    color: var(--el-text-color-secondary);
}

.fds-hint-icon {
    color: var(--el-text-color-placeholder);
    margin-bottom: 4px;
}

.fds-hint-title {
    font-size: 14px;
    color: var(--el-text-color-regular);
}

.fds-hint-desc {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
}

/* 分组建议 */
.fds-group + .fds-group {
    margin-top: 14px;
}

.fds-group-title {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    padding: 0 4px 6px;
}

.fds-group-error {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    padding: 2px 4px 6px;
}

.fds-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    border-radius: 8px;
    padding: 8px 10px;
    cursor: pointer;
}

.fds-item:hover {
    background: var(--el-fill-color-light);
}

.fds-item-title {
    font-size: 14px;
    color: var(--el-text-color-primary);
    line-height: 1.4;
}

.fds-item-kind {
    display: inline-block;
    margin-left: 6px;
    padding: 0 6px;
    border-radius: 4px;
    font-size: 11px;
    line-height: 18px;
    vertical-align: 1px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
}

.fds-item-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 加载骨架 */
.fds-skeleton {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 6px;
}

.fds-skeleton-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.fds-skeleton-line {
    height: 12px;
    border-radius: 6px;
    background: var(--el-fill-color-light);
    animation: fds-pulse 1.4s ease-in-out infinite;
}

.fds-skeleton-line.short {
    height: 10px;
    opacity: 0.7;
}

@keyframes fds-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
}

.fds-footer {
    display: flex;
    gap: 16px;
    padding: 10px 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
    font-size: 12px;
    color: var(--el-text-color-placeholder);
}

.fds-kbd kbd {
    padding: 1px 5px;
    border-radius: 4px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-blank);
    font-family: inherit;
    font-size: 11px;
    margin-right: 4px;
}

/* 过渡动画 */
.fds-fade-enter-active,
.fds-fade-leave-active {
    transition: opacity 0.18s ease;
}

.fds-fade-enter-active .fds-panel,
.fds-fade-leave-active .fds-panel {
    transition: transform 0.18s ease, opacity 0.18s ease;
}

.fds-fade-enter-from,
.fds-fade-leave-to {
    opacity: 0;
}

.fds-fade-enter-from .fds-panel,
.fds-fade-leave-to .fds-panel {
    transform: translateY(-8px) scale(0.98);
    opacity: 0;
}
</style>
