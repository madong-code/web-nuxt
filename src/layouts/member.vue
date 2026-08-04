<template>
    <div class="member-layout">
        <el-container class="layout-container">
            <el-header class="layout-header">
                <Header />
            </el-header>
            <el-scrollbar :style="calcHeight(60)" class="main-scrollbar" ref="mainScrollbarRef">
                <div class="layout-main">
                    <div class="layout-content">
                        <el-row class="layouts-main" justify="center">
                            <el-col class="user-layouts" :span="16" :xs="24">
                                <client-only>
                                    <Aside class="hidden-sm-and-down" />
                                </client-only>
                                <el-main class="layout-main-content">
                                    <slot />
                                </el-main>
                            </el-col>
                        </el-row>
                    </div>
                    <div class="layout-footer">
                      <Footer />
                    </div>
                </div>
            </el-scrollbar>
        </el-container>
    </div>
</template>

<script setup lang="ts">
    import Header from './components/header.vue'
    import Aside from './components/aside.vue'
    import Footer from './components/footer.vue'
    import { useLayoutScroll } from '~/composables/layout-scroll'

const { calcHeight } = useLayoutScroll()
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
    background-color: var(--el-bg-color-page);
    height: 60px;
    flex-shrink: 0;
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
        overflow-x: hidden;
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

.user-layouts {
    display: flex;
    padding-top: 15px;
    align-items: flex-start;
}
.layout-main-content {
    padding: 0 !important;
    overflow-x: hidden;
    background-color: var(--el-bg-color);
    margin-left: 20px;
    margin-bottom: 20px;
}

@media screen and (max-width: 768px) {
    .layout-main-content {
        margin-left: 0;
    }
}

.layout-main-content-mobile {
    padding: 0 !important;
    overflow-x: hidden;
    background-color: var(--el-bg-color);
    margin-bottom: 20px;
}

/* 组件样式适配 */
.layout-header {
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
  background-color: var(--el-bg-color-page) !important;
  position: relative;
  bottom: auto;
  width: 100%;
  left: 0;
  right: 0;
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

  .user-layouts-mobile {
    padding-top: 15px;
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

/* 响应式适配 */
@media screen and (max-width: 1024px) {
  .layout-container {
    .main-scrollbar {
      .layout-main {
        .layout-content {
          padding: 0 15px;
          --content-min-height: 400px;
        }
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .layout-container {
    .main-scrollbar {
      .layout-main {
        .layout-content {
          padding: 0 10px;
          --content-min-height: 300px;
        }
      }
    }
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