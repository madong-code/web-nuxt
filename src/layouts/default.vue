<template>
  <!--
    全站默认布局（前台 Portal 版）：
    - el-scrollbar 固定视口滚动（弹窗零位移、头部不露滚动条），header 68px
    - header/footer 由 layouts/components 提供（原 Portal 布局能力整体上收）
    - route.meta.portal_footer === false 时隐藏页脚（文档阅读等沉浸式场景）
  -->
  <el-container class="layout-container md-root">
    <el-header class="layout-header" height="68px">
      <layout-header />
    </el-header>
    <el-scrollbar :style="calcHeight(68)" class="main-scrollbar" ref="mainScrollbarRef">
      <div class="layout-main">
        <div class="layout-content">
          <slot></slot>
        </div>
        <div v-if="showFooter" class="layout-footer">
          <layout-footer />
        </div>
      </div>
    </el-scrollbar>
    <back-top />
    <AppWidgetHost slot-name="chat-window" />
  </el-container>
</template>

<script lang="ts" setup>
import layoutHeader from "./components/header.vue";
import layoutFooter from "./components/footer.vue";
import AppWidgetHost from "~/components/common/AppWidgetHost.vue";
import { useLayoutScroll } from "~/composables/layout-scroll";
import { useSiteConfig } from "~/composables/site-config";

const route = useRoute();
const { calcHeight } = useLayoutScroll(68);

/** 顶层 await 站点配置：保证页脚版权/备案 SSR 直出（共享 key，各组件直接消费） */
const { data: siteCfg } = await useSiteConfig();

/** footer=false 时隐藏整站页脚（如文档阅读页等沉浸式阅读场景），默认显示 */
const showFooter = computed(() => route.meta.portal_footer !== false);

// 百度统计：后台启用且填写 Key 后注入 hm.js（unhead 按 key 去重，路由切换不重复加载）
useHead({
  script: computed(() => {
    const cfg = siteCfg.value;
    if (!cfg?.tongji_enabled || !cfg.tongji_key) return [];
    return [
      { key: "baidu-tongji-init", tagPosition: "head", innerHTML: "var _hmt = _hmt || [];" },
      {
        key: "baidu-tongji-src",
        tagPosition: "head",
        async: true,
        src: `https://hm.baidu.com/hm.js?${cfg.tongji_key}`,
      },
    ];
  }),
});
</script>

<style scoped lang="scss">
.layout-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--md-bg-page);
  color: var(--md-text-1);

  .layout-header {
    position: relative;
    z-index: 1000;
    // 背景交由内部 header 组件毛玻璃实现，保持透明以透出页面内容
    background-color: transparent;
    // 清除 el-header 默认左右 padding，避免导航两侧露出默认底色
    padding: 0;
    flex-shrink: 0;
  }

  .main-scrollbar {
    flex: 1;
    overflow: hidden;

    // 横向溢出裁切：允许 hero 区块 50vw breakout 全幅铺开而不产生横向滚动条
    :deep(.el-scrollbar__wrap) {
      overflow-x: hidden;
    }

    // 粘性页脚关键：view 高度 auto，子级 min-height:100% 无法解析，
    // 故让 view 自身撑满视口并成为 flex 容器，layout-main flex:1 占满、footer 贴底
    :deep(.el-scrollbar__view) {
      min-height: 100%;
      display: flex;
      flex-direction: column;
    }

    .layout-main {
      width: 100%;
      max-width: 100%;
      display: flex;
      flex-direction: column;
      flex: 1;

      .layout-content {
        flex: 1;
        min-height: var(--content-min-height, 500px);
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 100%;
        overflow-x: visible;
        padding: 0;
      }

      .layout-footer {
        flex-shrink: 0;
        margin-top: auto;
        width: 100%;
        max-width: 100%;
      }
    }
  }
}

/* 全局重置 */
:global(html, body) {
  margin: 0;
  padding: 0;
  width: 100%;
}

/* 响应式断点：仅调整内容最小高度，不加页面留白（页面自带容器） */
@media screen and (max-width: 1024px) {
  .layout-container .main-scrollbar .layout-main .layout-content {
    --content-min-height: 400px;
  }
}

@media screen and (max-width: 768px) {
  .layout-container .main-scrollbar .layout-main .layout-content {
    --content-min-height: 300px;
  }
}

@media screen and (max-height: 650px) {
  .layout-container .main-scrollbar .layout-main .layout-content {
    --content-min-height: 200px;
  }
}

/* 滚动条样式优化 */
.main-scrollbar {
  :deep(.el-scrollbar__thumb) {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    &:hover {
      background-color: rgba(0, 0, 0, 0.3);
    }
  }

  :deep(.el-scrollbar__track) {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

/* 深色模式滚动条 */
@at-root html.dark {
  .main-scrollbar {
    :deep(.el-scrollbar__thumb) {
      background-color: rgba(255, 255, 255, 0.2);
      &:hover {
        background-color: rgba(255, 255, 255, 0.3);
      }
    }

    :deep(.el-scrollbar__track) {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
}
</style>
