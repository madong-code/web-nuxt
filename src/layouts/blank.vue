<template>
  <el-container class="layout-container">
    <el-header class="layout-header" height="64px">
      <layout-header />
    </el-header>
    <el-scrollbar :style="calcHeight(64)" class="main-scrollbar" ref="mainScrollbarRef">
      <div class="layout-main">
        <div class="layout-content">
          <slot></slot>
        </div>
      </div>
    </el-scrollbar>
    <back-top />
  </el-container>
</template>

<script lang="ts" setup>
import layoutHeader from "./components/header.vue";
import { useLayoutScroll } from '~/composables/layout-scroll';

const { calcHeight } = useLayoutScroll();
</script>

<style scoped lang="scss">
.layout-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .layout-header {
    position: relative;
    z-index: 1000;
    // 背景交由内部 ma-header 毛玻璃实现，保持透明以透出页面内容
    background-color: transparent;
    height: var(--el-header-height);
    flex-shrink: 0;
    // 与 default 布局一致：清除 el-header 默认左右 padding，避免导航两侧多余边距
    padding: 0;
  }
  
  .main-scrollbar {
    flex: 1;
    overflow: hidden;
    
    .layout-main {
      width: 100%;
      max-width: 100%;
      display: flex;
      flex-direction: column;
      min-height: 100%;
      
      .layout-content {
        flex: 1;
        min-height: var(--content-min-height, 500px);
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 100%;
        // 与 default 布局一致，避免全宽横幅被裁出两侧白边
        overflow-x: visible;
        padding: 0;
      }
    }
  }
}

/* 全局重置 */
:global(html, body) {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}

/* 响应式断点 */
@media screen and (max-width: 768px) {
  .layout-container {
    .layout-main {
      .layout-content {
        --content-min-height: 300px;
      }
    }
  }
}

@media screen and (max-width: 1024px) {
  .layout-container {
    .layout-main {
      .layout-content {
        --content-min-height: 400px;
      }
    }
  }
}

/* 组件样式适配 */
.layout-header {
  position: fixed;
  width: 100%;
  z-index: 1000;
  left: 0;
  right: 0;
  padding: 0;
  
  :deep(.header-logo) {
    span {
      padding-left: 4px;
    }
  }
  
  :deep(.frontend-header-menu) {
    background: transparent;
    .el-menu-item,
    .el-sub-menu .el-sub-menu__title {
      &.is-active {
        color: var(--el-color-primary) !important;
      }
      &:hover {
        background-color: transparent !important;
        color: var(--el-menu-hover-text-color) !important;
      }
    }
  }
}

/* 页面特定样式 */
.page-index {
  .layout-content {
    /* 首页特定样式 */
  }
}

.page-member {
  .layout-content {
    /* 会员页面特定样式 */
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
  
  .page-index {
    background: url(~/assets/images/bg-dark.jpg) repeat;
  }
}

@media screen and (max-height: 650px) {
  .layout-container {
    .main-scrollbar {
      .layout-main {
        .layout-content {
          --content-min-height: 200px;
        }
      }
    }
  }
}
</style>
