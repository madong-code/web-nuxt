<template>
  <!-- SEO Meta 组件 - Nuxt 4.2+ 支持 -->
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useHead, useRoute } from 'nuxt/app'
import { useConfigStore } from '~/stores/config'

const route = useRoute()
const configStore = useConfigStore()

// 从路由 meta 中读取页面自定义 SEO 配置
const pageSeo = computed(() => ({
  // 支持 definePageMeta 和路由配置两种方式
  title: route.meta.title as string || '',
  description: route.meta.description as string || '',
  keywords: route.meta.keywords as string || '',
  image: route.meta.image as string || '',
  noIndex: route.meta.noIndex as boolean || false,
  noFollow: route.meta.noFollow as boolean || false
}))

// SEO 配置数据 - 直接从 configStore 读取
const seoConfig = computed(() => ({
  // 基础 SEO 配置
  title: configStore.siteSetting?.seo_title || 'madong通用快速开发框架',
  description: configStore.siteSetting?.seo_description || 'madong开源服务平台',
  keywords: configStore.siteSetting?.seo_keywords || ['madong', 'madong-admin', 'madong工作流'],
  siteName: configStore.siteSetting?.site_name || 'madong官网',
  siteUrl: configStore.siteSetting?.site_url || (typeof window !== 'undefined' ? window.location.origin : ''),
  shareImage: configStore.siteSetting?.share_image || '/images/share-default.png'
}))

// 组合 SEO 标题（页面标题优先）
const seoTitle = computed(() => {
  if (pageSeo.value.title) {
    return `${pageSeo.value.title} - ${seoConfig.value.siteName}`
  }
  return seoConfig.value.title
})

// 组合 SEO 描述（页面描述优先）
const seoDescription = computed(() => {
  return pageSeo.value.description || seoConfig.value.description
})

// 组合 SEO 关键词（页面关键词优先）
const seoKeywords = computed(() => {
  const baseKeywords = Array.isArray(seoConfig.value.keywords)
    ? seoConfig.value.keywords.join(',')
    : seoConfig.value.keywords

  if (pageSeo.value.keywords) {
    return `${pageSeo.value.keywords},${baseKeywords}`
  }
  return baseKeywords
})

// 组合分享图片（页面图片优先）
const seoImage = computed(() => {
  return pageSeo.value.image || seoConfig.value.shareImage
})

// 构建完整的 SEO 元数据数组
const seoMetaArray = computed(() => {
  const metaArray = [
    // 基础 SEO Meta
    { name: 'description', content: seoDescription.value },
    { name: 'keywords', content: seoKeywords.value },
    { name: 'author', content: seoConfig.value.siteName },

    // Open Graph (社交媒体分享)
    { property: 'og:title', content: seoTitle.value },
    { property: 'og:description', content: seoDescription.value },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${seoConfig.value.siteUrl}${route.path}` },
    { property: 'og:image', content: seoImage.value },
    { property: 'og:site_name', content: seoConfig.value.siteName },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: seoTitle.value },
    { name: 'twitter:description', content: seoDescription.value },
    { name: 'twitter:image', content: seoImage.value }
  ]

  // 添加 robots meta（如果需要）
  if (pageSeo.value.noIndex || pageSeo.value.noFollow) {
    const robotsDirectives = []
    if (pageSeo.value.noIndex) robotsDirectives.push('noindex')
    if (pageSeo.value.noFollow) robotsDirectives.push('nofollow')
    metaArray.push({ name: 'robots', content: robotsDirectives.join(',') })
  }

  return metaArray
})

// 链接标签数组
const linkArray = computed(() => [
  // Canonical URL
  { rel: 'canonical', href: `${seoConfig.value.siteUrl}${route.path}` },
  // Favicon
  { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
])

// 直接使用 useHead，它会自动响应式更新
const headData = computed(() => ({
  title: seoTitle.value,
  htmlAttrs: {
    lang: 'zh-CN'
  },
  meta: seoMetaArray.value,
  link: linkArray.value
}))

useHead(headData)

// 调试日志
watchEffect(() => {
  // console.log('SEO 数据更新:', {
  //   title: seoTitle.value,
  //   description: seoDescription.value,
  //   keywords: seoKeywords.value,
  //   siteSetting: configStore.siteSetting
  // })
})
</script>
