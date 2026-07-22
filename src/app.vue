<template>
    <div>
        <!-- SEO 组件 -->
        <Seo />

        <el-config-provider :value-on-clear="() => null" :locale="locale">
            <NuxtLayout>
                <NuxtPage />
            </NuxtLayout>
        </el-config-provider>

        <!-- 百度统计组件 -->
        <BaiduAnalytics />
    </div>
</template>

<script setup lang="ts">
// @ts-ignore
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
// @ts-ignore
import en from 'element-plus/dist/locale/en.mjs'
import type { Language } from 'element-plus/es/locale'
import { onMounted, computed } from 'vue'
import { initDark, getDark } from './utils/dark'
import { useHead } from 'nuxt/app'

// modules import mark, Please do not remove.
import { useSystemStore } from './stores/system'
import { useMemberStore } from './stores/member'

const systemStore = useSystemStore()
const locale = computed(() => (systemStore.lang === 'zh-cn' ? zhCn : en))



// 在服务器端渲染时就设置正确的 dark 类
useHead({
  htmlAttrs: {
    class: getDark() ? 'dark' : ''
  }
})

// 仅在客户端执行，避免 SSR 时清空持久化的 token
if (import.meta.client) {
  const memberStore = useMemberStore()
  // 如果有 token 但没有 refreshToken（比如旧数据），清除它
  if (memberStore.token && !memberStore.refreshToken) {
    memberStore.token = ''
  }
}

onMounted(async () => {
  // 站点信息与语言初始化已移至 plugins/init-site.client.ts（确保在中间件之前完成）
  // 初始化暗黑模式（确保客户端与服务器端保持一致）
  initDark()
})
</script>
