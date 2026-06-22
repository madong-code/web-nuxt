<template>
    <el-aside class="member-sidebar">
        <!-- 用户信息区域 -->
        <div class="member-sidebar__user-info">
            <div @click="routerPush('/member/profile')" class="member-sidebar__avatar-container">
                <img class="member-sidebar__avatar" :src="getAvatarUrl(memberStore?.info?.avatar)" alt="" />
            </div>
            <p class="member-sidebar__username">{{ memberStore?.info?.nickname }}</p>
        </div>

        <el-menu
            class="member-sidebar__menu"
            :default-active="activeMenu"
            unique-opened
        >
            <div v-for="(item, idx) in systemStore.site.member_menu" :key="idx">
                <el-sub-menu 
                    v-if="item.children && item.children.length && checkMenuShow(item)"
                    :index="item.id.toString()"
                >
                    <template #title>
                        <Icon v-if="item.icon" :icon="item.icon" size="16" />
                        <span>{{ item.title }}</span>
                    </template>
                    <div v-for="(menu, index) in item.children.filter(m => m)" :key="index">
                        <el-menu-item 
                            v-if="checkMenuShow(menu)"
                            :index="menu.path"
                            @click="routerPush(menu)"
                        >
                            <Icon v-if="menu.icon" :icon="menu.icon" size="16" />
                            <span>{{ menu.title }}</span>
                        </el-menu-item>
                    </div>
                </el-sub-menu>
                
                <el-menu-item 
                    v-else-if="checkMenuShow(item)"
                    :index="item.path"
                    @click="routerPush(item)"
                >
                    <Icon v-if="item.icon" :icon="item.icon" size="16" />
                    <span>{{ item.title }}</span>
                </el-menu-item>
            </div>
        </el-menu>
    </el-aside>
</template>

<script setup lang="ts">
import type { Menus } from '~/stores/interface'
// 在组件顶部导入图片
import defaultAvatar from '~/assets/images/default_avatar.png'
import { useSystemStore } from '~/stores/system'
import { useMemberStore } from '~/stores/member'
import { useRoute, navigateTo } from 'nuxt/app'
import { computed } from 'vue'
import { fullUrl } from '~/utils/common'
import { Icon } from '~/components/icon'

const route = useRoute()
const memberStore = useMemberStore()
const systemStore = useSystemStore()

const checkMenuShow = (menu: Menus): boolean => {
    if (!menu) {
        return false
    }
    
    const permissions = menu.meta?.permissions
    
    if (!permissions || permissions.length === 0) {
        return true
    }
    
    const result = systemStore.checkMenuPermission(menu)
    return result
}

// 当前激活的菜单
const activeMenu = computed(() => {
    return route.path
})

/**
 * 获取用户头像URL
 */
const getAvatarUrl = (avatarUrl: string | null | undefined): string => {
  if (!avatarUrl || avatarUrl.trim() === "") {
    return defaultAvatar
  }
  return fullUrl(avatarUrl)
}

/**
 * 处理菜单点击
 */
const onClickMenu = (menu: Menus) => {
    if (systemStore.isDirectory(menu)) {
        return
    }

    if (systemStore.isExternalLink(menu)) {
        const target = systemStore.getTarget(menu)
        if (menu.url) {
            window.open(menu.url, target)
        }
        return
    }

    if (menu.path) {
        navigateTo(menu.path)
    }
}

/**
 * 菜单跳转
 */
const routerPush = (route: string | Menus) => {
    if (typeof route === 'string') {
        navigateTo(route)
    } else {
        onClickMenu(route)
    }
}
</script>

<style scoped lang="scss">
.member-sidebar {
    width: 240px;
    background-color: var(--ma-bg-color-overlay);
    box-shadow: var(--el-box-shadow-light);
    border-radius: 8px;
    overflow: hidden;
}

.member-sidebar__user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
}

.member-sidebar__avatar-container {
    position: relative;
    cursor: pointer;
    margin-bottom: 12px;
}

.member-sidebar__avatar {
    display: block;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    background-color: black;
}

.member-sidebar__avatar-gender {
    position: absolute;
    bottom: 0;
    right: 0;
    height: 20px;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--ma-bg-color-overlay);
    border-radius: 50%;
    box-shadow: var(--el-box-shadow);
}

.member-sidebar__username {
    text-align: center;
    width: 100%;
    margin: 8px 0 16px;
    font-size: var(--el-font-size-large);
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.member-sidebar__button-group {
    display: flex;
    gap: 8px;
}

.member-sidebar__button {
    font-size: var(--el-font-size-small);
    height: 32px;
    min-width: 80px;
}

.member-sidebar__menu {
    border: none;
    background: transparent;
    
    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
        height: 44px;
        line-height: 44px;
        
        .icon {
            margin-right: 8px;
            width: 16px;
            height: 16px;
        }
    }
    
    :deep(.el-menu-item.is-active) {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
    }
}

/* 响应式设计 */
@media screen and (max-width: 991px) {
    .member-sidebar {
        width: 100%;
        border-radius: 0;
        box-shadow: none;
    }
    
    .member-sidebar__user-info {
        padding: 20px 16px;
    }
    
    .member-sidebar__avatar {
        width: 60px;
        height: 60px;
    }
    
    .member-sidebar__button-group {
        flex-direction: column;
        width: 100%;
    }
    
    .member-sidebar__button {
        width: 100%;
    }
}

@media screen and (max-width: 768px) {
    .member-sidebar {
        display: none;
    }
}
</style>