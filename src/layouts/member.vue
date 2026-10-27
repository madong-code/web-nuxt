<template>
  <!--
    个人中心独立板块布局（member 板块专用，meta.layout='member' 的路由挂载）：
    - 与 default 同骨架（header 68px / el-scrollbar / footer / back-top / ChatWindow），
      区别仅在内容区由 MemberShell 常驻外壳包裹（头卡 + 两行 tag 导航 + 通用内容区）
    - 同名 layout 实例常驻：/member/* 页签互切时壳不重挂，头卡与导航零闪烁
    - route.meta.portal_footer === false 时隐藏页脚
  -->
  <el-container class="layout-container md-root">
    <el-header class="layout-header" height="68px">
      <layout-header />
    </el-header>
    <el-scrollbar :style="calcHeight(68)" class="main-scrollbar" ref="mainScrollbarRef">
      <div class="layout-main">
        <div class="layout-content">
          <div class="member-content">
            <MemberShell>
              <slot></slot>
            </MemberShell>
          </div>
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
import MemberShell from "~/components/member/MemberShell.vue";
import { useLayoutScroll } from "~/composables/layout-scroll";
import { useSiteConfig } from "~/composables/site-config";

const route = useRoute();
const { calcHeight } = useLayoutScroll(68);

/** 顶层 await 站点配置：共享 key（与 default 布局同一份缓存，不重复请求） */
const { data: siteCfg } = await useSiteConfig();

/** footer=false 时隐藏整站页脚，默认显示 */
const showFooter = computed(() => route.meta.portal_footer !== false);

// 百度统计：与 default 布局同 key，unhead 去重不重复注入
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

      // 个人中心命名空间：嵌入模块的样式边界参照（见 specs/member-module/spec.md）
      .member-content {
        flex: 1;
        width: 100%;
        max-width: 100%;
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
</style>
