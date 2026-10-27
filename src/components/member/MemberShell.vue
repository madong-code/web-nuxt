<script setup lang="ts">

import { t } from '~/composables/lang'
/**
 * 个人中心统一外壳（框架层组件，/member/* 子页共用）：
 * - 未登录：引导卡（立即登录）
 * - 已登录：头卡（渐变封面 + 头像 + @username/email/描述 + 编辑资料/退出登录）
 *   + 两行式 tag 导航（图2：行1 分组页签、行2 当前分组子项 pill）
 * - tag 导航完全由 useNav().member_menus（web_menu category=2）自动构建，
 *   禁止硬编码条目——其他插件按菜单协议接入后三处 UI（下拉/tag/概述）自动出现；
 *   可见性信任后端三类过滤（公开/登录/权限码），前端仅叠加 membership 业务开关
 * ClientOnly：memberStore 为客户端持久化状态，SSR 阶段恒为空，避免注水 mismatch
 */
import { UserCircle, PencilLine, LogOut, Camera } from 'lucide-vue-next'
import { useMemberStore } from '~/stores/member'
import { useNav } from '~/composables/nav'
import { useSiteConfig } from '~/composables/site-config'
import {
    filterMemberTree,
    resolveMemberIcon,
    memberGroupMatches,
    useMemberBadges,
} from '~/composables/member-menu'
import defaultAvatar from '~/assets/images/default_avatar.png'
import { fullUrl } from '~/utils/common'
import type { NavMenuItem } from '~/api/site'
import { provideMemberShellCtx } from '~/composables/member-modules'
import MemberAvatarCropper from '~/components/member/MemberAvatarCropper.vue'

defineOptions({ name: 'MemberShell' })

const route = useRoute()
const memberStore = useMemberStore()
const { data: siteCfg } = useSiteConfig()
const { data: navData, refresh: refreshNav } = useNav()
const { badgeForUrl, dotForUrl } = useMemberBadges()

/** 会员菜单树：useNav 已按登录态/权限码过滤，此处叠加 membership 业务开关 */
const memberItems = computed<NavMenuItem[]>(() =>
    filterMemberTree(navData.value?.member_menus, siteCfg.value?.membership_enabled),
)

/**
 * 行1 分组页签：仅目录节点（有 url 的直达项只进头像下拉——直达 url 与分组子项
 * 落地页相同时会产生「点击 A 高亮 B」的错位，tag 导航行1 语义保持纯分组）
 */
const groupTabs = computed<NavMenuItem[]>(() => memberItems.value.filter((m) => !m.url))

/** 行1 激活分组：目录子树前缀包含当前路径优先，无命中回落第一个分组 */
const activeGroup = computed<NavMenuItem | null>(() => {
    if (!groupTabs.value.length) return null
    return groupTabs.value.find((m) => memberGroupMatches(m, route.path)) ?? groupTabs.value[0] ?? null
})

/** 行2 子项 pill：激活分组的 children（两层级菜单，仅取带 url 的叶子） */
const activePills = computed<NavMenuItem[]>(() =>
    (activeGroup.value?.children ?? []).filter((m) => m.url),
)

const groupTabActive = (item: NavMenuItem) => activeGroup.value === item

/** 点击分组页签 → 进入该组第一个子项（保证页签点击必有响应） */
const goGroup = (group: NavMenuItem) => {
    const first = (group.children ?? []).find((m) => m.url)
    if (first?.url) go(first.url)
}
const pillActive = (url: string) => (url || '').split('?')[0] === route.path

const go = (path: string) => navigateTo(path)
const avatarUrl = computed(() =>
    memberStore.info?.avatar ? fullUrl(memberStore.info.avatar) : defaultAvatar,
)

/* ===== 公共头部头像上传（上传能力统一挂在壳上，/member/* 各页可用） ===== */
const avatarCropperRef = ref<InstanceType<typeof MemberAvatarCropper>>()
/** 点击头像 → 直接唤起系统文件选择器，选中后进入裁剪预览 */
const pickAvatar = () => avatarCropperRef.value?.pick()
/** 上传成功：后端已更新会员头像，刷新 store 使头卡/导航等全局头像同步更新 */
const onAvatarUploaded = async () => {
    await memberStore.getMemberInfo()
}

/** 嵌入模块上下文注入（组件级扩展接口，详见 specs/member-module/spec.md） */
provideMemberShellCtx({
    memberStore,
    siteCfg,
    badgeForUrl,
    dotForUrl,
    refreshNav,
    activeGroup,
    activePills,
})
</script>

<template>
  <ClientOnly>
    <!-- 未登录引导 -->
    <div v-if="!memberStore.info" class="w-full max-w-[1250px] mx-auto px-4 py-10">
      <div class="bg-[color:var(--md-bg)] rounded-lg border border-[color:var(--md-border)] p-10 text-center">
        <UserCircle class="w-12 h-12 mx-auto text-[color:var(--md-text-3)] mb-4" />
        <h1 class="text-lg font-semibold text-[color:var(--md-text-1)] mb-2">个人中心</h1>
        <p class="text-sm text-[color:var(--md-text-3)] mb-6">登录后可管理帖子、收藏、评论、订单、授权与开发者中心</p>
        <button
          class="px-6 py-2.5 rounded-lg bg-[color:var(--md-primary)] text-white text-sm hover:bg-[color:var(--el-color-primary-dark-2)] transition-colors"
          @click="memberStore.logOpen()"
        >
          立即登录
        </button>
      </div>
    </div>

    <!-- 已登录：头卡 + 两行 tag 导航 + 内容 -->
    <div v-else class="w-full max-w-[1250px] mx-auto px-4 py-5">
      <!-- 头卡（图3）：渐变封面 + 头像叠加 + 信息 + 操作 -->
      <section class="ms-card overflow-hidden">
        <div class="ms-banner" />
        <div class="ms-head-row">
          <!-- 头像：公共头部统一上传入口（悬停遮罩 + 点击唤起选图，全站 /member/* 可用） -->
          <div class="ms-avatar-wrap" title="更换头像">
            <img class="ms-avatar" :src="avatarUrl" alt="" @click="pickAvatar">
            <div class="ms-avatar-mask" aria-hidden="true">
              <Camera class="ms-mask-icon" />
              <span>更换头像</span>
            </div>
          </div>
          <div class="ms-head-info">
            <h1>{{ memberStore.info.nickname || memberStore.info.email || '会员' }}</h1>
            <p class="ms-meta">
              <span v-if="memberStore.info.username" class="ms-meta-uid">@{{ memberStore.info.username }}</span>
              <span v-if="memberStore.info.email">{{ memberStore.info.email }}</span>
            </p>
            <p class="ms-motto">{{ memberStore.info.motto || '管理你的资料、内容与开发者模块' }}</p>
          </div>
          <div class="ms-head-actions">
            <button type="button" class="ms-btn-primary" @click="go('/member/profile')">
              <PencilLine class="w-3.5 h-3.5" />
              编辑资料
            </button>
            <button type="button" class="ms-btn-plain" @click="memberStore.logout('/')">
              <LogOut class="w-3.5 h-3.5" />
              退出登录
            </button>
          </div>
        </div>
      </section>

      <!-- 两行式 tag 导航（图2）：行1 分组页签 + 行2 当前分组子项 pill，全量 member_menus 自动构建 -->
      <nav class="ms-card ms-nav">
        <div class="ms-tabs">
          <button
            v-for="top in groupTabs"
            :key="top.name"
            type="button"
            class="ms-tab"
            :class="{ 'ms-tab-active': groupTabActive(top) }"
            @click="goGroup(top)"
          >
            <component :is="resolveMemberIcon(top.icon)" class="w-4 h-4 shrink-0" />
            <span class="truncate">{{ top.name }}</span>
          </button>
        </div>

        <div v-if="activePills.length" class="ms-pills">
          <NuxtLink
            v-for="pill in activePills"
            :key="pill.url"
            :to="pill.url!"
            :target="pill.external ? '_blank' : undefined"
            :rel="pill.external ? 'noopener' : undefined"
            class="ms-pill"
            :class="{ 'ms-pill-active': pillActive(pill.url) }"
          >
            <span class="relative flex items-center">
              <component :is="resolveMemberIcon(pill.icon)" class="w-3.5 h-3.5" />
              <span v-if="badgeForUrl(pill.url)" class="md-menu-badge">{{ badgeForUrl(pill.url) }}</span>
              <span v-else-if="dotForUrl(pill.url)" class="md-menu-dot"></span>
            </span>
            <span class="truncate">{{ pill.name }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- 当前子页内容 -->
      <div class="mt-4">
        <slot />
      </div>

      <!-- 公共头部头像上传弹窗：选择 → 预览 → 裁剪 → 提交，成功后刷新会员状态全局同步 -->
      <MemberAvatarCropper ref="avatarCropperRef" @success="onAvatarUploaded" />
    </div>

    <template #fallback>
      <div class="w-full max-w-[1250px] mx-auto px-4 py-20 text-center text-sm text-[color:var(--md-text-3)]">加载中…</div>
    </template>
  </ClientOnly>
</template>

<style lang="scss" scoped>
.ms-card {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* ===== 头卡 ===== */
.ms-banner {
  height: 110px;
  background:
    radial-gradient(ellipse 60% 180% at 10% -60%, color-mix(in srgb, var(--el-color-primary) 22%, transparent) 0%, transparent 62%),
    linear-gradient(90deg, color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color)) 0%, var(--el-bg-color) 72%);

  /* 暗黑下 bg-color 趋黑导致渐变不可见：提高主色混合比并垫浅一档底色 */
  html.dark & {
    background:
      radial-gradient(ellipse 60% 180% at 10% -60%, color-mix(in srgb, var(--el-color-primary) 35%, transparent) 0%, transparent 62%),
      linear-gradient(90deg, color-mix(in srgb, var(--el-color-primary) 26%, var(--el-fill-color-light)) 0%, var(--el-bg-color) 72%);
  }
}

.ms-head-row {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  padding: 0 28px 18px;
  margin-top: -34px;
}

/* 头像容器：悬停浮现「更换头像」遮罩，点击唤起上传 */
.ms-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.ms-avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  object-fit: cover;
  background-color: var(--el-fill-color);
  box-shadow:
    0 0 0 4px var(--el-bg-color),
    0 6px 18px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  cursor: pointer;
  display: block;
  transition: transform 0.2s ease;
}

.ms-avatar-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 50%;
  font-size: 11px;
  line-height: 1.2;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.ms-mask-icon {
  width: 16px;
  height: 16px;
}

.ms-avatar-wrap:hover .ms-avatar-mask {
  opacity: 1;
}

.ms-avatar-wrap:hover .ms-avatar {
  transform: scale(1.04);
}

.ms-head-info {
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

.ms-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 5px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  overflow: hidden;

  .ms-meta-uid {
    font-weight: 600;
    color: var(--el-text-color-regular);
  }
}

.ms-motto {
  margin: 3px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ms-head-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: flex-end;
  margin-bottom: 6px;
}

.ms-btn-primary,
.ms-btn-plain {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ms-btn-primary {
  border: 1px solid var(--el-color-primary);
  background-color: var(--el-color-primary);
  color: #fff;

  &:hover {
    background-color: var(--el-color-primary-dark-2);
    border-color: var(--el-color-primary-dark-2);
  }
}

.ms-btn-plain {
  border: 1px solid var(--el-border-color);
  background-color: transparent;
  color: var(--el-text-color-regular);

  &:hover {
    color: var(--el-color-danger);
    border-color: var(--el-color-danger-light-5);
    background-color: var(--el-color-danger-light-9);
  }
}

/* ===== 两行式 tag 导航 ===== */
.ms-nav {
  margin-top: 14px;
  padding: 6px 12px 10px;
}

.ms-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  &::-webkit-scrollbar {
    display: none;
  }
}

.ms-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  color: var(--el-text-color-regular);
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
  max-width: 180px;

  &:hover {
    color: var(--el-color-primary);
  }
}

/* 激活页签：主色文字 + 底部短横线 */
.ms-tab-active {
  color: var(--el-color-primary);
  font-weight: 600;

  &::after {
    content: '';
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: -1px;
    height: 2px;
    border-radius: 2px;
    background: var(--el-color-primary);
  }
}

.ms-pills {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 10px;
}

.ms-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  transition: all 0.2s ease;
  max-width: 160px;

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

/* 当前路由 pill：蓝底主色 */
.ms-pill-active,
.ms-pill-active:hover {
  color: #fff;
  background: var(--el-color-primary);
}

/* ===== 响应式 ===== */
@media screen and (max-width: 768px) {
  .ms-banner {
    height: 76px;
  }

  .ms-head-row {
    flex-wrap: wrap;
    padding: 0 16px 16px;
    gap: 14px;
    margin-top: -26px;
  }

  .ms-avatar {
    width: 64px;
    height: 64px;
  }

  .ms-head-info h1 {
    font-size: 18px;
  }

  .ms-head-actions {
    width: 100%;
    margin-bottom: 0;
  }
}
</style>
