<template>
  <div v-if="shouldLoadAnalytics">
    <!-- 百度统计代码将被注入到这里 -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useConfigStore } from '~/stores/config'

const configStore = useConfigStore()
const shouldLoadAnalytics = ref(false)
const analyticsLoaded = ref(false)

// 加载百度统计脚本
const loadBaiduAnalytics = () => {
  if (!configStore.analytics.baidu_tongji_enabled || !configStore.analytics.baidu_tongji_code) {
    return
  }

  if (analyticsLoaded.value) {
    return
  }

  try {
    // 创建百度统计脚本
    const script = document.createElement('script')
    script.text = `
      var _hmt = _hmt || [];
      (function() {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?${configStore.analytics.baidu_tongji_code}";
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(hm, s);
      })();
    `
    document.head.appendChild(script)
    analyticsLoaded.value = true
    console.log('百度统计已加载')
  } catch (error) {
    console.error('百度统计加载失败:', error)
  }
}

// 初始化 - 配置已在 app.vue 中统一加载，这里直接使用
onMounted(() => {
  // 检查是否应该加载统计
  shouldLoadAnalytics.value = configStore.analytics.baidu_tongji_enabled === 1 && !!configStore.analytics.baidu_tongji_code

  // 加载统计脚本
  if (shouldLoadAnalytics.value) {
    loadBaiduAnalytics()
  }
})

// 监听配置变化
watch(
  () => [
    configStore.analytics.baidu_tongji_enabled,
    configStore.analytics.baidu_tongji_code
  ],
  () => {
    shouldLoadAnalytics.value = configStore.analytics.baidu_tongji_enabled === 1 && !!configStore.analytics.baidu_tongji_code
    if (shouldLoadAnalytics.value && !analyticsLoaded.value) {
      loadBaiduAnalytics()
    }
  },
  { deep: true }
)
</script>

<script lang="ts">
// 这是一个无界面的组件，主要用于加载百度统计
export default {
  name: 'BaiduAnalytics'
}
</script>
