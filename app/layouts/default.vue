<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <layout-header />
    </el-header>
    <el-main class="layout-main">
      <div class="layout-content">
        <slot></slot>
      </div>
      <layout-footer />
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import layoutHeader from "./components/header.vue";
import layoutFooter from "./components/footer.vue";
</script>

<style scoped lang="scss">
.layout-container {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  
  .layout-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background-color: var(--el-bg-color);
    box-shadow: var(--el-box-shadow-light);
    height: 60px;
  }
  
  .layout-main {
    --el-main-padding: 0 !important;
    padding: 0 !important;
    min-height: calc(100vh - 60px);
    margin-top: 60px;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    
    .layout-content {
      flex: 1;
      min-height: var(--content-min-height, 500px);
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }
    
    .layout-footer {
      flex-shrink: 0;
      margin-top: auto;
      width: 100%;
      max-width: 100%;
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
  background-color: var(--el-bg-color) !important;
  box-shadow: var(--el-box-shadow-light) !important;
  position: fixed;
  width: 100%;
  z-index: 1000;
  left: 0;
  right: 0;
  
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

.layout-footer {
  color: var(--el-text-color-secondary);
  background-color: transparent !important;
  position: relative;
  bottom: auto;
  width: 100%;
  left: 0;
  right: 0;
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

/* 响应式适配 */
@media screen and (max-width: 1024px) {
  .page-index {
    .layout-main {
      .layout-content {
        /* 平板端首页样式 */
      }
    }
  }
}

@media screen and (max-width: 375px) {
  .page-index {
    .layout-main {
      .layout-content {
        /* 小屏手机首页样式 */
      }
    }
  }
}

@media screen and (max-height: 650px) {
  .page-index {
    .layout-main {
      .layout-content {
        /* 矮屏设备样式 */
      }
    }
  }
}

/* 深色模式 */
@at-root html.dark {
  .page-index {
    background: url(~/assets/images/bg-dark.jpg) repeat;
  }
}
</style>