<template>
    <div class="member-layout">
        <el-container class="layout-container">
            <el-header class="layout-header" height="64px">
                <Header />
            </el-header>
            <el-scrollbar :style="calcHeight(64)" class="main-scrollbar" ref="mainScrollbarRef">
                <div class="layout-main">
                    <div class="layout-content">
                        <!-- 掘金式个人中心：居中卡片流（头卡 + 粘性导航 + 左主右辅） -->
                        <div class="member-page">
                            <client-only>
                                <!-- 用户头卡：封面渐变条 + 头像叠加 + 昵称/简介 + 编辑资料 -->
                                <section class="user-card">
                                    <div class="user-card__banner"></div>
                                    <div class="user-card__row">
                                        <img
                                            class="user-card__avatar"
                                            :src="getAvatarUrl(memberStore?.info?.avatar)"
                                            alt=""
                                            @click="navigateTo('/member/profile')"
                                        />
                                        <div class="user-card__info">
                                            <h1>{{ memberStore?.info?.nickname || '访客' }}</h1>
                                            <p class="user-card__desc">
                                                <span
                                                    v-if="memberStore?.info?.username"
                                                    class="user-card__uid"
                                                >@{{ memberStore.info.username }}</span>
                                                <span
                                                    v-if="memberStore?.info?.username"
                                                    class="user-card__divider"
                                                >·</span>
                                                管理你的资料、内容与开发者模块
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            class="user-card__edit"
                                            @click="navigateTo('/member/profile')"
                                        >编辑资料</button>
                                    </div>
                                </section>
                                <!-- 粘性导航条（分组 Tab + 子页面胶囊） -->
                                <Aside />
                            </client-only>
                            <div class="member-content">
                                <main class="member-main">
                                    <div class="member-card">
                                        <slot />
                                    </div>
                                </main>
                                <aside class="member-side">
                                    <div class="side-card">
                                        <h3 class="side-card__title">快捷入口</h3>
                                        <ul class="side-card__list">
                                            <li
                                                v-for="item in quickLinks"
                                                :key="item.path"
                                                :class="{ 'is-active': route?.path === item.path }"
                                                @click="navigateTo(item.path)"
                                            >
                                                <span>{{ item.title }}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </aside>
                            </div>
                        </div>
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
    import { useMemberStore } from '~/stores/member'
    import { useRoute, navigateTo } from 'nuxt/app'
    import defaultAvatar from '~/assets/images/default_avatar.png'
    import { fullUrl } from '~/utils/common'

const { calcHeight } = useLayoutScroll()
const memberStore = useMemberStore()
const route = useRoute()

// 右侧栏快捷入口
const quickLinks = [
    { title: '个人资料', path: '/member/profile' },
    { title: '修改密码', path: '/member/password' },
    { title: '第三方绑定', path: '/member/third-party' },
    { title: '每日签到', path: '/member/sign' },
    { title: '余额记录', path: '/member/balance' }
]

/**
 * 获取用户头像URL
 */
const getAvatarUrl = (avatarUrl: string | null | undefined): string => {
    if (!avatarUrl || avatarUrl.trim() === '') {
        return defaultAvatar
    }
    return fullUrl(avatarUrl)
}
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
    // 背景交由内部 ma-header 毛玻璃实现，保持透明以透出页面内容（与主站布局一致）
    background-color: transparent;
    height: var(--el-header-height);
    // 清除 el-header 默认左右 padding，保证导航铺满全宽
    padding: 0;
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

/* 掘金式个人中心：居中卡片流容器 */
.member-page {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 20px 20px 40px;
}

/* 用户头卡：封面渐变条 + 头像叠加 + 信息 + 编辑资料 */
.user-card {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.user-card__banner {
  height: 110px;
  background:
    radial-gradient(ellipse 60% 180% at 10% -60%, color-mix(in srgb, var(--el-color-primary) 22%, transparent) 0%, transparent 62%),
    linear-gradient(90deg, color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color)) 0%, var(--el-bg-color) 72%);
}

.user-card__row {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  padding: 0 28px 20px;
  margin-top: -34px;
}

.user-card__avatar {
  flex-shrink: 0;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  object-fit: cover;
  background-color: var(--el-fill-color);
  box-shadow:
    0 0 0 4px var(--el-bg-color),
    0 6px 18px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.04);
  }
}

.user-card__info {
  flex: 1;
  min-width: 0;
  padding-bottom: 2px;

  h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.3;
    color: var(--el-text-color-primary);
  }
}

.user-card__desc {
  display: flex;
  align-items: center;
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);

  .user-card__uid {
    font-weight: 600;
    color: var(--el-text-color-regular);
  }

  .user-card__divider {
    margin: 0 8px;
    color: var(--el-text-color-placeholder);
  }
}

.user-card__edit {
  flex-shrink: 0;
  align-self: flex-end;
  margin-bottom: 6px;
  padding: 7px 18px;
  border-radius: 999px;
  border: 1px solid var(--el-color-primary-light-7);
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--el-color-primary);
    border-color: var(--el-color-primary);
    color: #fff;
  }
}

/* 内容区：左主内容 + 右快捷入口 */
.member-content {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-top: 20px;
}

.member-main {
  flex: 1;
  min-width: 0;
}

.member-side {
  width: 280px;
  flex-shrink: 0;
  // 长页面滚动时侧栏跟随吸顶（避开固定头部 64px + 粘性导航高度）
  position: sticky;
  top: 116px;
  align-self: flex-start;
}

.side-card {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.side-card__title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.side-card__list {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 2px;
    font-size: 14px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    border-top: 1px solid var(--el-border-color-extra-light);
    transition: color 0.2s ease;

    &:first-child {
      border-top: none;
    }

    &::after {
      content: '›';
      font-size: 16px;
      color: var(--el-text-color-placeholder);
      transition: color 0.2s ease;
    }

    &:hover {
      color: var(--el-color-primary);

      &::after {
        color: var(--el-color-primary);
      }
    }

    // 当前页高亮
    &.is-active {
      color: var(--el-color-primary);
      font-weight: 600;

      &::after {
        color: var(--el-color-primary);
      }
    }
  }
}

.member-card {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 12px;
  padding: 28px 32px;
  min-height: 420px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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

/* 滚动条样式优化（与主站布局一致） */
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

/* 响应式断点 */
@media screen and (max-width: 1024px) {
  .layout-container {
    .main-scrollbar {
      .layout-main {
        .layout-content {
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
          --content-min-height: 300px;
        }
      }
    }
  }

  .user-card__banner {
    height: 76px;
  }

  .user-card__row {
    padding: 0 16px 16px;
    gap: 14px;
    margin-top: -26px;
  }

  .user-card__avatar {
    width: 64px;
    height: 64px;
  }

  .user-card__info h1 {
    font-size: 18px;
  }

  .user-card__desc {
    margin-top: 4px;
    font-size: 12px;
  }

  .user-card__edit {
    padding: 5px 14px;
    font-size: 12px;
  }

  .member-page {
    padding: 12px 10px 24px;
  }

  .member-content {
    margin-top: 14px;
    gap: 0;
  }

  .member-card {
    padding: 18px 16px;
    border-radius: 10px;
    min-height: 320px;
  }
}

/* 991px 以下隐藏右侧栏（与掘金窄屏行为一致） */
@media screen and (max-width: 991px) {
  .member-side {
    display: none;
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
