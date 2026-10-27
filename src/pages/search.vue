<template>
    <div class="page-container">
        <div class="search-hero">
            <h1 class="search-title">{{ $t('common.search.resultTitle') }}</h1>

            <!-- 关键词输入：回车或按钮提交（更新 URL query，可分享/可回退） -->
            <div class="search-box">
                <el-input v-model="keyword" size="large" :placeholder="$t('common.search.placeholder')" clearable
                    class="search-input" @keydown.enter.prevent="submit">
                    <template #prefix>
                        <el-icon>
                            <Search />
                        </el-icon>
                    </template>
                </el-input>
                <el-button type="primary" size="large" class="search-button" @click="submit">
                    {{ $t('common.search.toSearch') }}
                </el-button>
            </div>
        </div>

        <div class="search-content">
            <template v-if="q">
                <div class="search-toolbar">
                    <p class="search-query-label">
                        {{ $t('common.search.queryLabel') }}：<span class="search-query-value">{{ q }}</span>
                        <span v-if="totalResults" class="search-total">{{ $t('common.search.resultCount', { count: totalResults }) }}</span>
                    </p>
                    <!-- 排序切换：仅前端重排已取回结果，不重新请求 -->
                    <el-radio-group v-model="sort" size="default">
                        <el-radio-button value="grouped">{{ $t('common.search.sortGrouped') }}</el-radio-button>
                        <el-radio-button value="latest">{{ $t('common.search.sortLatest') }}</el-radio-button>
                        <el-radio-button value="hot">{{ $t('common.search.sortHot') }}</el-radio-button>
                    </el-radio-group>
                </div>

                <!-- 加载骨架（首屏/换词时） -->
                <div v-if="loading && groups.length === 0" class="search-skeleton" aria-hidden="true">
                    <div v-for="i in 3" :key="i" class="skeleton-card">
                        <div class="skeleton-line" :style="{ width: 38 + (i % 3) * 16 + '%' }" />
                        <div class="skeleton-line" :style="{ width: 82 - (i % 2) * 18 + '%' }" />
                    </div>
                </div>

                <!-- 无任何数据源：回落空态 -->
                <el-empty v-else-if="!searchStore.sourceList.length" :description="$t('common.search.emptyDesc')">
                    <template #image>
                        <el-icon class="search-empty-icon">
                            <Search />
                        </el-icon>
                    </template>
                    <p class="search-empty-title">{{ $t('common.search.emptyTitle') }}</p>
                </el-empty>

                <!-- 无结果 -->
                <el-empty v-else-if="totalResults === 0 && !anyError" :description="$t('common.search.noResult')">
                    <template #image>
                        <el-icon class="search-empty-icon">
                            <Search />
                        </el-icon>
                    </template>
                </el-empty>

                <template v-else>
                    <!-- 综合排序：按数据源分组（组序 = sourceList priority 降序） -->
                    <template v-if="sort === 'grouped'">
                        <section v-for="g in groups" :key="g.source.id" class="result-group">
                            <div class="group-head">
                                <h2 class="group-title">{{ g.source.title || g.source.id }}</h2>
                                <span v-if="g.items.length" class="group-count">{{ g.items.length }}</span>
                            </div>
                            <p v-if="g.error" class="group-error">{{ $t('common.search.sourceUnavailable') }}</p>
                            <NuxtLink v-for="(item, idx) in g.items" :key="idx" :to="item.url" class="result-item">
                                <ItemBody :item="item" :show-source="false" />
                            </NuxtLink>
                        </section>
                    </template>

                    <!-- 最新 / 最热：跨源合并排序（无 time/heat 的沉底） -->
                    <template v-else>
                        <div class="result-flat">
                            <NuxtLink v-for="(row, idx) in flatItems" :key="idx" :to="row.item.url" class="result-item">
                                <ItemBody :item="row.item" :show-source="true" :source-title="row.sourceTitle" />
                            </NuxtLink>
                        </div>
                        <p v-if="anyError" class="group-error flat-error">{{ $t('common.search.sourceUnavailable') }}</p>
                    </template>
                </template>
            </template>

            <el-empty v-else :description="$t('common.search.placeholder')" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { t } from '~/composables/lang'

const $t = t
/**
 * 框架统一搜索页（/search，聚合模式）：
 * - 关键词经 URL query（?q=）承载，回车/按钮触发，可分享可回退
 * - 数据来自 useSearchStore().searchAll 聚合的全部已注册数据源（错误隔离）；
 *   无插件注册数据源时保持框架默认空态
 * - 排序切换（综合分组/最新/最热）仅前端重排已取回结果，不重新请求；
 *   latest 按 time 倒序、hot 按 heat 倒序，缺省沉底
 */
import { Search } from '@element-plus/icons-vue'
import type { SearchResultItem, SearchSourceGroup } from '~/stores/search'

definePageMeta({
    layout: 'default',
})

const route = useRoute()

const q = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))
const keyword = ref(q.value)

const searchStore = useSearchStore()
type SortMode = 'grouped' | 'latest' | 'hot'
const sort = ref<SortMode>('grouped')

const groups = ref<SearchSourceGroup[]>([])
const loading = ref(false)
let fetchSeq = 0

const totalResults = computed(() => groups.value.reduce((n, g) => n + g.items.length, 0))
const anyError = computed(() => groups.value.some((g) => !!g.error))

/** 跨源合并视图（latest/hot 用），附分组标题供条目展示来源 */
const flatItems = computed(() => {
    const all = groups.value.flatMap((g) =>
        g.items.map((item) => ({ item, sourceTitle: g.source.title || g.source.id })),
    )
    if (sort.value === 'latest') {
        return all.sort((a, b) => (b.item.time ?? Number.NEGATIVE_INFINITY) - (a.item.time ?? Number.NEGATIVE_INFINITY))
    }
    if (sort.value === 'hot') {
        return all.sort((a, b) => (b.item.heat ?? Number.NEGATIVE_INFINITY) - (a.item.heat ?? Number.NEGATIVE_INFINITY))
    }
    return all
})

const fetchAll = async (kw: string) => {
    if (!kw) {
        fetchSeq++
        groups.value = []
        loading.value = false
        return
    }
    const seq = ++fetchSeq
    loading.value = true
    try {
        const res = await searchStore.searchAll(kw, { limit: 10 })
        if (seq === fetchSeq) groups.value = res.groups
    } catch {
        if (seq === fetchSeq) groups.value = []
    } finally {
        if (seq === fetchSeq) loading.value = false
    }
}

// 外部跳转带新 q 时同步输入框并重查
watch(q, (v) => {
    keyword.value = v
    fetchAll(v)
})

// 纯客户端取数（数据源函数不可序列化，不进 SSR payload）
onMounted(() => fetchAll(q.value))

const submit = () => {
    const next = keyword.value.trim()
    if (!next || next === q.value) return
    navigateTo({ path: '/search', query: { q: next } })
}

const fmtTime = (ts?: number) => {
    if (!ts) return ''
    try {
        return new Date(ts).toLocaleDateString()
    } catch {
        return ''
    }
}

/** 结果条目主体（分组/合并两种视图共用） */
const ItemBody = defineComponent({
    name: 'SearchItemBody',
    props: {
        item: { type: Object as PropType<SearchResultItem>, required: true },
        showSource: { type: Boolean, default: false },
        sourceTitle: { type: String, default: '' },
    },
    setup(props) {
        return () => h('div', { class: 'item-body' }, [
            h('div', { class: 'item-head' }, [
                h('span', { class: 'item-title' }, props.item.title),
                props.item.kindLabel
                    ? h('span', { class: 'item-kind' }, props.item.kindLabel)
                    : null,
            ]),
            props.item.description
                ? h('p', { class: 'item-desc' }, props.item.description)
                : null,
            (props.showSource && props.sourceTitle) || fmtTime(props.item.time)
                ? h('p', { class: 'item-meta' }, [
                    props.showSource && props.sourceTitle
                        ? h('span', props.sourceTitle)
                        : null,
                    fmtTime(props.item.time) ? h('span', fmtTime(props.item.time)) : null,
                ])
                : null,
        ])
    },
})
</script>

<style lang="scss" scoped>
.page-container {
    min-height: 100vh;
    background: var(--el-bg-color-page);
    padding: 48px 20px 80px;
}

.search-hero {
    max-width: 720px;
    margin: 0 auto;
    text-align: center;

    .search-title {
        font-size: 28px;
        font-weight: bold;
        color: var(--el-text-color-primary);
        margin-bottom: 24px;
    }

    .search-box {
        display: flex;
        gap: 12px;

        .search-input {
            flex: 1;
        }

        .search-button {
            flex-shrink: 0;
        }
    }
}

.search-content {
    max-width: 720px;
    margin: 40px auto 0;
}

.search-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;

    .search-query-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);

        .search-query-value {
            color: var(--el-color-primary);
            font-weight: 600;
        }

        .search-total {
            margin-left: 10px;
            font-size: 12px;
            color: var(--el-text-color-placeholder);
        }
    }
}

/* 分组视图 */
.result-group {
    margin-bottom: 28px;
}

.group-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 10px;

    .group-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }

    .group-count {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        background: var(--el-fill-color-light);
        border-radius: 10px;
        padding: 0 8px;
        line-height: 20px;
    }
}

.group-error {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
    padding: 8px 0;
}

.flat-error {
    margin-top: 8px;
}

/* 结果条目（分组/合并共用） */
.result-item {
    display: block;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 10px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.result-item:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: var(--el-box-shadow-light);
}

.item-body {
    .item-head {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .item-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        line-height: 1.4;
    }

    .item-kind {
        flex-shrink: 0;
        font-size: 11px;
        line-height: 18px;
        padding: 0 6px;
        border-radius: 4px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
    }

    .item-desc {
        margin-top: 4px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .item-meta {
        margin-top: 6px;
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: var(--el-text-color-placeholder);
    }
}

/* 加载骨架 */
.search-skeleton {
    .skeleton-card {
        background: var(--el-bg-color);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 10px;
    }

    .skeleton-line {
        height: 13px;
        border-radius: 6px;
        background: var(--el-fill-color-light);
        animation: sr-pulse 1.4s ease-in-out infinite;
        margin-bottom: 8px;
    }

    .skeleton-line:last-child {
        margin-bottom: 0;
    }
}

@keyframes sr-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
}

.search-empty-icon {
    font-size: 48px;
    color: var(--el-text-color-placeholder);
}

.search-empty-title {
    margin-top: 12px;
    font-size: 14px;
    color: var(--el-text-color-regular);
}
</style>
